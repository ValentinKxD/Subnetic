import Database from 'better-sqlite3';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Підключення до SQLite (better-sqlite3, синхронний API) */

/** Корінь пакета server (src/db → ../..). */
const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const DB_DIR = path.join(SERVER_ROOT, 'db');
export const SCHEMA_PATH = path.join(DB_DIR, 'schema.sql');
export const SEED_PATH = path.join(DB_DIR, 'seed.sql');
export const DB_PATH = process.env.SUBNETIC_DB ?? path.join(SERVER_ROOT, 'data', 'subnetic.db');

export type DB = Database.Database;

function hasSchema(db: DB): boolean {
  const row = db
    .prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get() as { n: number };
  return row.n > 0;
}

/** Відкриває (і за потреби створює) БД. */
export function openDatabase(file: string = DB_PATH): DB {
  if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  // WAL + busy_timeout: сервер і бот працюють з одним файлом БД
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');
  if (!hasSchema(db)) {
    db.exec(readFileSync(SCHEMA_PATH, 'utf8'));
  } else {
    migrate(db);
  }
  return db;
}

function hasColumn(db: DB, table: string, column: string): boolean {
  return (db.prepare(`SELECT name FROM pragma_table_info(?)`).all(table) as Array<{ name: string }>).some(
    (c) => c.name === column,
  );
}

/** Міграції для БД, створених старішою schema.sql */
function migrate(db: DB): void {
  // Курси НБУ: дата курсу і джерело.
  if (!hasColumn(db, 'exchange_rates', 'rate_date')) {
    db.transaction(() => {
      db.exec(`
        ALTER TABLE exchange_rates ADD COLUMN rate_date TEXT NOT NULL DEFAULT '1970-01-01'
          CHECK (rate_date IS date(rate_date));
        ALTER TABLE exchange_rates ADD COLUMN source TEXT NOT NULL DEFAULT 'seed'
          CHECK (source IN ('nbu', 'seed'));
        UPDATE exchange_rates SET rate_date = date(fetched_at);
        DELETE FROM exchange_rates WHERE id NOT IN (
          SELECT max(id) FROM exchange_rates GROUP BY currency, rate_date
        );
        CREATE UNIQUE INDEX ux_exchange_rates_currency_date ON exchange_rates (currency, rate_date);
        DROP VIEW IF EXISTS v_current_rates;
        CREATE VIEW v_current_rates AS
        SELECT currency, rate_to_uah, rate_date, source, fetched_at
        FROM (
          SELECT e.*, row_number() OVER (
            PARTITION BY e.currency ORDER BY e.source = 'nbu' DESC, e.rate_date DESC, e.fetched_at DESC
          ) AS rn
          FROM exchange_rates e
        )
        WHERE rn = 1;
      `);
    })();
    console.log('Міграція БД: exchange_rates отримала rate_date і source.');
  }
}

let instance: DB | null = null;

/** Спільне підключення застосунку (відкривається при першому зверненні). */
export function getDb(): DB {
  instance ??= openDatabase();
  return instance;
}

export function closeDb(): void {
  instance?.close();
  instance = null;
  statements.clear();
}

const statements = new Map<string, Database.Statement>();

/** Підготовлений запит (кешується за текстом SQL, щоб не компілювати повторно). */
export function sql(source: string): Database.Statement {
  let stmt = statements.get(source);
  if (!stmt) {
    stmt = getDb().prepare(source);
    statements.set(source, stmt);
  }
  return stmt;
}

/** Виконує функцію в транзакції (усе або нічого). */
export function transaction<T>(fn: () => T): T {
  return getDb().transaction(fn)();
}

/** SQLite 0/1 → boolean. */
export const bool = (v: unknown): boolean => v === 1 || v === true;

/** 'YYYY-MM-DD HH:MM:SS' (UTC, як пише datetime('now')) → ISO 8601 для API. */
export function isoDateTime(v: string): string;
export function isoDateTime(v: string | null): string | null;
export function isoDateTime(v: string | null): string | null {
  return v === null ? null : `${v.replace(' ', 'T')}Z`;
}
