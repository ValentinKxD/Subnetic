import type { PaymentMethod, PaymentMethodType } from '../types.js';
import { bool, sql, transaction } from './index.js';

/** Доступ до payment_methods. Усі запити обмежені user_id власника. */

interface Row {
  id: number;
  user_id: number;
  type: PaymentMethodType;
  label: string;
  details: string;
  is_default: number;
}

const COLUMNS = `id, user_id, type, title AS label, details, is_default`;
const toMethod = (r: Row): PaymentMethod => ({ ...r, is_default: bool(r.is_default) });

export function listPaymentMethods(userId: number): PaymentMethod[] {
  return (
    sql(`SELECT ${COLUMNS} FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, id`).all(userId) as Row[]
  ).map(toMethod);
}

export function findPaymentMethod(userId: number, id: number): PaymentMethod | undefined {
  const row = sql(`SELECT ${COLUMNS} FROM payment_methods WHERE id = ? AND user_id = ?`).get(id, userId) as
    | Row
    | undefined;
  return row ? toMethod(row) : undefined;
}

function clearDefault(userId: number): void {
  sql(`UPDATE payment_methods SET is_default = 0 WHERE user_id = ? AND is_default = 1`).run(userId);
}

/** Перші 4 цифри з кінця назви/деталей, напр. «Visa ·4242» → 4242. */
function last4(...texts: string[]): string | null {
  for (const t of texts) {
    const m = /(\d{4})\D*$/.exec(t);
    if (m?.[1]) return m[1];
  }
  return null;
}

export function insertPaymentMethod(
  userId: number,
  data: { type: PaymentMethodType; label: string; details: string; is_default: boolean },
): PaymentMethod {
  return transaction(() => {
    // Перший спосіб оплати автоматично стає основним.
    const isDefault = data.is_default || listPaymentMethods(userId).length === 0;
    if (isDefault) clearDefault(userId);
    const { lastInsertRowid } = sql(
      `INSERT INTO payment_methods (user_id, title, type, last4, details, is_default)
       VALUES (@user_id, @label, @type, @last4, @details, @is_default)`,
    ).run({
      user_id: userId,
      label: data.label,
      type: data.type,
      last4: data.type === 'card' ? last4(data.label, data.details) : null,
      details: data.details,
      is_default: Number(isDefault),
    });
    return findPaymentMethod(userId, Number(lastInsertRowid)) as PaymentMethod;
  });
}

export function updatePaymentMethod(
  userId: number,
  id: number,
  patch: Partial<{ type: PaymentMethodType; label: string; details: string; is_default: boolean }>,
): PaymentMethod | undefined {
  return transaction(() => {
    const current = findPaymentMethod(userId, id);
    if (!current) return undefined;
    const next = { ...current, ...patch };
    // Зняти «основний» з єдиного основного не можна — він лишається основним.
    const isDefault = patch.is_default === true || current.is_default;
    if (patch.is_default === true && !current.is_default) clearDefault(userId);
    sql(
      `UPDATE payment_methods
       SET title = @label, type = @type, details = @details, is_default = @is_default, last4 = @last4
       WHERE id = @id AND user_id = @user_id`,
    ).run({
      id,
      user_id: userId,
      label: next.label,
      type: next.type,
      details: next.details,
      is_default: Number(isDefault),
      last4: next.type === 'card' ? last4(next.label, next.details) : null,
    });
    return findPaymentMethod(userId, id);
  });
}

/** Видаляє спосіб оплати; підписки втрачають посилання (ON DELETE SET NULL); основним стає наступний. */
export function deletePaymentMethod(userId: number, id: number): boolean {
  return transaction(() => {
    const current = findPaymentMethod(userId, id);
    if (!current) return false;
    sql(`DELETE FROM payment_methods WHERE id = ? AND user_id = ?`).run(id, userId);
    if (current.is_default) {
      sql(
        `UPDATE payment_methods SET is_default = 1
         WHERE id = (SELECT id FROM payment_methods WHERE user_id = ? ORDER BY id LIMIT 1)`,
      ).run(userId);
    }
    return true;
  });
}
