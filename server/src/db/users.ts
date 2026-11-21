import type { User } from '../types.js';
import { sql, transaction } from './index.js';

/** Доступ до таблиць users, user_settings (створення) і telegram_link_tokens. */

const COLUMNS = `id, nickname, email, phone, password_hash, telegram_chat_id, telegram_username,
  telegram_linked_at, created_at, role, blocked_at`;

export function findUserById(id: number): User | undefined {
  return sql(`SELECT ${COLUMNS} FROM users WHERE id = ?`).get(id) as User | undefined;
}

/** nickname і email мають COLLATE NOCASE, тому пошук без урахування регістру. */
export function findUserByEmail(email: string): User | undefined {
  return sql(`SELECT ${COLUMNS} FROM users WHERE email = ?`).get(email) as User | undefined;
}

export function findUserByNickname(nickname: string): User | undefined {
  return sql(`SELECT ${COLUMNS} FROM users WHERE nickname = ?`).get(nickname) as User | undefined;
}

/** Створює користувача і його налаштування за замовчуванням (в одній транзакції). */
export function insertUser(data: { nickname: string; email: string; phone: string | null; password_hash: string }): User {
  return transaction(() => {
    const { lastInsertRowid } = sql(
      `INSERT INTO users (nickname, email, phone, password_hash) VALUES (@nickname, @email, @phone, @password_hash)`,
    ).run(data);
    const id = Number(lastInsertRowid);
    sql(`INSERT INTO user_settings (user_id) VALUES (?)`).run(id);
    return findUserById(id) as User;
  });
}

export function updateUserProfile(id: number, data: { nickname: string; email: string; phone: string | null }): User {
  sql(`UPDATE users SET nickname = @nickname, email = @email, phone = @phone WHERE id = @id`).run({ ...data, id });
  return findUserById(id) as User;
}

/** Відв'язка Telegram: чат, username і дату прив'язки очищаємо, невикористані токени видаляємо. */
export function clearTelegram(id: number): User {
  return transaction(() => {
    sql(
      `UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL, telegram_linked_at = NULL WHERE id = ?`,
    ).run(id);
    sql(`DELETE FROM telegram_link_tokens WHERE user_id = ?`).run(id);
    return findUserById(id) as User;
  });
}

/** Новий одноразовий токен прив'язки (бот приймає його в /start <токен>) */
export function insertTelegramLinkToken(userId: number, token: string, ttlMinutes: number): string {
  return transaction(() => {
    sql(`DELETE FROM telegram_link_tokens WHERE user_id = ? OR expires_at < datetime('now')`).run(userId);
    sql(
      `INSERT INTO telegram_link_tokens (token, user_id, expires_at)
       VALUES (?, ?, datetime('now', '+' || ? || ' minutes'))`,
    ).run(token, userId, ttlMinutes);
    const row = sql(`SELECT expires_at FROM telegram_link_tokens WHERE token = ?`).get(token) as { expires_at: string };
    return row.expires_at;
  });
}
