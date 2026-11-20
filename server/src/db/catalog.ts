import type { Category, Plan, Service } from '../types.js';
import { sql } from './index.js';

/** Доступ до categories, services, plans */

export function listCategories(): Category[] {
  // Порядок як у seed (id), але «Інше» — завжди останнє.
  return sql(`SELECT id, slug, name FROM categories ORDER BY slug = 'other', id`).all() as Category[];
}

export function findCategory(id: number): Category | undefined {
  return sql(`SELECT id, slug, name FROM categories WHERE id = ?`).get(id) as Category | undefined;
}

const SERVICE_COLUMNS = `id, category_id, owner_user_id, name, icon, brand_color, website`;
const PLAN_COLUMNS = `id, service_id, user_id, name, price, currency, billing_period`;

export function listVisibleServices(userId: number): Service[] {
  return sql(
    `SELECT ${SERVICE_COLUMNS} FROM services WHERE owner_user_id IS NULL OR owner_user_id = ?`,
  ).all(userId) as Service[];
}

export function listVisiblePlans(userId: number): Plan[] {
  return sql(
    `SELECT ${PLAN_COLUMNS} FROM plans WHERE user_id IS NULL OR user_id = ? ORDER BY service_id, price, id`,
  ).all(userId) as Plan[];
}

export function findVisibleService(userId: number, id: number): Service | undefined {
  return sql(
    `SELECT ${SERVICE_COLUMNS} FROM services WHERE id = ? AND (owner_user_id IS NULL OR owner_user_id = ?)`,
  ).get(id, userId) as Service | undefined;
}

/** Тариф видимий, якщо видимі і він, і його сервіс. */
export function findVisiblePlan(userId: number, id: number): Plan | undefined {
  return sql(
    `SELECT p.id, p.service_id, p.user_id, p.name, p.price, p.currency, p.billing_period
     FROM plans p JOIN services s ON s.id = p.service_id
     WHERE p.id = @id
       AND (p.user_id IS NULL OR p.user_id = @userId)
       AND (s.owner_user_id IS NULL OR s.owner_user_id = @userId)`,
  ).get({ id, userId }) as Plan | undefined;
}

export function findPlanById(id: number): Plan | undefined {
  return sql(`SELECT ${PLAN_COLUMNS} FROM plans WHERE id = ?`).get(id) as Plan | undefined;
}

/** Чи є серед видимих сервісів такий самий (без урахування регістру, зокрема кирилиці). */
export function visibleServiceNameExists(userId: number, name: string): boolean {
  const lower = name.toLocaleLowerCase('uk');
  return listVisibleServices(userId).some((s) => s.name.toLocaleLowerCase('uk') === lower);
}

export function insertService(data: {
  owner_user_id: number;
  category_id: number;
  name: string;
  brand_color: string;
}): Service {
  const { lastInsertRowid } = sql(
    `INSERT INTO services (category_id, owner_user_id, name, icon, brand_color, website)
     VALUES (@category_id, @owner_user_id, @name, NULL, @brand_color, NULL)`,
  ).run(data);
  return sql(`SELECT ${SERVICE_COLUMNS} FROM services WHERE id = ?`).get(Number(lastInsertRowid)) as Service;
}

export function insertPlan(data: Omit<Plan, 'id'>): Plan {
  const { lastInsertRowid } = sql(
    `INSERT INTO plans (service_id, user_id, name, price, currency, billing_period)
     VALUES (@service_id, @user_id, @name, @price, @currency, @billing_period)`,
  ).run(data);
  return findPlanById(Number(lastInsertRowid)) as Plan;
}
