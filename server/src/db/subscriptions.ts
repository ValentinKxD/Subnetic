import type { Subscription, SubscriptionDetails } from '../types.js';
import { bool, sql } from './index.js';

/** Доступ до subscriptions. Усі запити обмежені user_id власника. */

const DETAILS_SELECT = `
  SELECT
    s.id, s.user_id, s.plan_id, s.payment_method_id, s.status, s.start_date, s.trial_end_date,
    s.next_payment_date, s.auto_renew, s.cancelled_at, s.note,
    p.service_id     AS p_service_id,
    p.user_id        AS p_user_id,
    p.name           AS p_name,
    p.price          AS p_price,
    p.currency       AS p_currency,
    p.billing_period AS p_billing_period,
    sv.category_id   AS sv_category_id,
    sv.owner_user_id AS sv_owner_user_id,
    sv.name          AS sv_name,
    sv.icon          AS sv_icon,
    sv.brand_color   AS sv_brand_color,
    sv.website       AS sv_website,
    c.name           AS category_name,
    pm.title         AS payment_method_label
  FROM subscriptions s
  JOIN plans p       ON p.id = s.plan_id
  JOIN services sv   ON sv.id = p.service_id
  JOIN categories c  ON c.id = sv.category_id
  LEFT JOIN payment_methods pm ON pm.id = s.payment_method_id AND pm.user_id = s.user_id`;

interface DetailsRow {
  id: number;
  user_id: number;
  plan_id: number;
  payment_method_id: number | null;
  status: Subscription['status'];
  start_date: string;
  trial_end_date: string | null;
  next_payment_date: string | null;
  auto_renew: number;
  cancelled_at: string | null;
  note: string | null;
  p_service_id: number;
  p_user_id: number | null;
  p_name: string;
  p_price: number;
  p_currency: SubscriptionDetails['plan']['currency'];
  p_billing_period: SubscriptionDetails['plan']['billing_period'];
  sv_category_id: number;
  sv_owner_user_id: number | null;
  sv_name: string;
  sv_icon: string | null;
  sv_brand_color: string;
  sv_website: string | null;
  category_name: string;
  payment_method_label: string | null;
}

function toDetails(r: DetailsRow): SubscriptionDetails {
  return {
    id: r.id,
    user_id: r.user_id,
    plan_id: r.plan_id,
    payment_method_id: r.payment_method_id,
    status: r.status,
    start_date: r.start_date,
    trial_end_date: r.trial_end_date,
    next_payment_date: r.next_payment_date,
    auto_renew: bool(r.auto_renew),
    cancelled_at: r.cancelled_at,
    note: r.note,
    plan: {
      id: r.plan_id,
      service_id: r.p_service_id,
      user_id: r.p_user_id,
      name: r.p_name,
      price: r.p_price,
      currency: r.p_currency,
      billing_period: r.p_billing_period,
    },
    service: {
      id: r.p_service_id,
      category_id: r.sv_category_id,
      owner_user_id: r.sv_owner_user_id,
      name: r.sv_name,
      icon: r.sv_icon,
      brand_color: r.sv_brand_color,
      website: r.sv_website,
    },
    category_name: r.category_name,
    payment_method_label: r.payment_method_label,
  };
}

export function listSubscriptionDetails(userId: number): SubscriptionDetails[] {
  return (sql(`${DETAILS_SELECT} WHERE s.user_id = ? ORDER BY s.id`).all(userId) as DetailsRow[]).map(toDetails);
}

export function findSubscriptionDetails(userId: number, id: number): SubscriptionDetails | undefined {
  const row = sql(`${DETAILS_SELECT} WHERE s.user_id = ? AND s.id = ?`).get(userId, id) as DetailsRow | undefined;
  return row ? toDetails(row) : undefined;
}

type WritableFields = Omit<Subscription, 'id' | 'user_id' | 'cancelled_at'>;

function params(data: WritableFields) {
  return { ...data, auto_renew: Number(data.auto_renew) };
}

export function insertSubscription(userId: number, data: WritableFields): number {
  const { lastInsertRowid } = sql(
    `INSERT INTO subscriptions
       (user_id, plan_id, payment_method_id, status, start_date, trial_end_date, next_payment_date, auto_renew, note)
     VALUES
       (@user_id, @plan_id, @payment_method_id, @status, @start_date, @trial_end_date, @next_payment_date, @auto_renew, @note)`,
  ).run({ ...params(data), user_id: userId });
  return Number(lastInsertRowid);
}

/** Перезаписує редаговані поля (cancelled_at веде тригер за статусом). */
export function updateSubscription(userId: number, id: number, data: WritableFields): void {
  sql(
    `UPDATE subscriptions
     SET plan_id = @plan_id, payment_method_id = @payment_method_id, status = @status, start_date = @start_date,
         trial_end_date = @trial_end_date, next_payment_date = @next_payment_date, auto_renew = @auto_renew, note = @note
     WHERE id = @id AND user_id = @user_id`,
  ).run({ ...params(data), id, user_id: userId });
}

/** Видаляє підписку разом з її платежами й нагадуваннями (ON DELETE CASCADE). */
export function deleteSubscription(userId: number, id: number): boolean {
  return sql(`DELETE FROM subscriptions WHERE id = ? AND user_id = ?`).run(id, userId).changes > 0;
}
