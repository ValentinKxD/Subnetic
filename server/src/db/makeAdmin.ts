import '../env.js';
import { closeDb, DB_PATH, getDb } from './index.js';

/**
 * Призначення адміністратора з командного рядка:
 *   npm run make-admin -w server -- <nickname або email>
 * Далі роль змінює лише інший адміністратор через адмін-панель.
 */

const identifier = process.argv[2]?.trim();
if (!identifier) {
  console.error('Вкажіть нікнейм або email: npm run make-admin -w server -- <nickname або email>');
  process.exit(1);
}

const db = getDb();
const column = identifier.includes('@') ? 'email' : 'nickname';
const user = db.prepare(`SELECT id, nickname, role FROM users WHERE ${column} = ?`).get(identifier) as
  | { id: number; nickname: string; role: string }
  | undefined;

if (!user) {
  console.error(`Користувача «${identifier}» не знайдено в ${DB_PATH}`);
  closeDb();
  process.exit(1);
}

if (user.role === 'admin') {
  console.log(`${user.nickname} уже адміністратор.`);
} else {
  db.transaction(() => {
    db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(user.id);
    db.prepare(`INSERT INTO admin_log (admin_id, action, details) VALUES (NULL, 'user.role', ?)`).run(
      `Користувачу ${user.nickname} надано роль адміністратора (npm run make-admin)`,
    );
  })();
  console.log(`Готово: ${user.nickname} тепер адміністратор. Оновіть сторінку сайту.`);
}
closeDb();
