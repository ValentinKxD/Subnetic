import type { Currency, PaymentDetails, PaymentStatus } from '../types.js';
import { isoDateTime, sql } from './index.js';

/** Доступ до payments. Належність користувачу перевіряється через subscriptions.user_id. */

const DETAILS_SELECT = `
  SELECT
    pay.id, pay.subscription_id, pay.amount, pay.currency, pay.due_date, pay.status, pay.paid_at,
    sv.name AS service_name, sv.icon AS service_icon, sv.brand_color,
    p.name AS plan_name, p.billing_period,
    pm.title AS payment_method_label
  FROM payments pay
  JOIN subscriptions s ON s.id = pay.subscription_id
  JOIN plans p         ON p.id = s.plan_id
  JOIN services sv     ON sv.id = p.service_id
  LEFT JOIN payment_methods pm ON pm.id = pay.payment_method_id AND pm.user_id = s.user_id`;

const toDetails = (r: PaymentDetails): PaymentDetails => ({ ...r, paid_at: isoDateTime(r.paid_at) });

export interface PaymentFilter {
  from?: string;
  to?: string;
  status?: PaymentStatus;
  subscription_id?: number;
}

/** Платежі користувача (новіші спершу); фільтри за датою графіка, статусом і підпискою — у SQL. */
export function listPayments(userId: number, filter: PaymentFilter = {}): PaymentDetails[] {
  const rows = sql(
    `${DETAILS_SELECT}
     WHERE s.user_id = @userId
       AND (@from IS NULL OR pay.due_date >= @from)
       AND (@to IS NULL OR pay.due_date <= @to)
       AND (@status IS NULL OR pay.status = @status)
       AND (@subscription_id IS NULL OR pay.subscription_id = @subscription_id)
     ORDER BY pay.due_date DESC, pay.id DESC`,
  ).all({
    userId,
    from: filter.from ?? null,
    to: filter.to ?? null,
    status: filter.status ?? null,
    subscription_id: filter.subscription_id ?? null,
  }) as PaymentDetails[];
  return rows.map(toDetails);
}

export function findPayment(userId: number, id: number): PaymentDetails | undefined {
  const row = sql(`${DETAILS_SELECT} WHERE s.user_id = ? AND pay.id = ?`).get(userId, id) as PaymentDetails | undefined;
  return row ? toDetails(row) : undefined;
}

/** Записує платіж */
export function insertPayment(data: {
  subscription_id: number;
  amount: number;
  currency: Currency;
  due_date: string;
  status: PaymentStatus;
  payment_method_id: number | null;
}): number {
  const { lastInsertRowid } = sql(
    `INSERT INTO payments (subscription_id, amount, currency, due_date, status, payment_method_id)
     VALUES (@subscription_id, @amount, @currency, @due_date, @status, @payment_method_id)`,
  ).run(data);
  return Number(lastInsertRowid);
}
