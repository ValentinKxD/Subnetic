import '../env.js';
import { readFileSync } from 'node:fs';
import { refreshRates } from '../services/rates.js';
import { closeDb, DB_PATH, openDatabase, SCHEMA_PATH, SEED_PATH } from './index.js';

/** `npm run seed`: перестворює вміст БД і заповнює її з seed.sql */

const db = openDatabase();
const schemaSql = readFileSync(SCHEMA_PATH, 'utf8');
const seedSql = readFileSync(SEED_PATH, 'utf8');

const objects = db
  .prepare(
    `SELECT type, name FROM sqlite_master
     WHERE name NOT LIKE 'sqlite_%' AND type IN ('view', 'trigger', 'table')
     ORDER BY CASE type WHEN 'view' THEN 0 WHEN 'trigger' THEN 1 ELSE 2 END`,
  )
  .all() as Array<{ type: 'view' | 'trigger' | 'table'; name: string }>;

// Зовнішні ключі вимикаємо на час перестворення (у транзакції цю PRAGMA змінити не можна).
db.pragma('foreign_keys = OFF');
db.transaction(() => {
  for (const { type, name } of objects) db.exec(`DROP ${type.toUpperCase()} IF EXISTS "${name}"`);
  db.exec(schemaSql);
  db.exec(seedSql);
})();
db.pragma('foreign_keys = ON');

const problems = db.pragma('foreign_key_check') as unknown[];
if (problems.length > 0) {
  console.error('Порушення зовнішніх ключів після seed:', problems);
  process.exit(1);
}

const tables = [
  'users',
  'user_settings',
  'categories',
  'services',
  'plans',
  'payment_methods',
  'subscriptions',
  'payments',
  'exchange_rates',
] as const;

console.log(`БД заповнено: ${DB_PATH}`);
for (const table of tables) {
  const { n } = db.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number };
  console.log(`  ${table.padEnd(16)} ${n}`);
}
db.close();

// Одразу підтягуємо курс НБУ, щоб не чекати перезапуску сервера. Без мережі лишаться резервні курси.
await refreshRates();
closeDb();
