import { ADMIN_PAGE_SIZE } from '../../../shared/admin.js';
import type { BillingPeriod, Currency, Role } from '../types.js';
import { bool, getDb, isoDateTime, sql } from './index.js';

/** SQL адмін-панелі: статистика, користувачі, глобальний каталог, журнал дій */

/** Активні підписки — ті, за які користувач платить або скоро почне (як на дашборді). */
const ACTIVE_STATUSES = `('active', 'trial')`;

/** Рядок для LIKE з екрануванням % і _. */
function likePattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** UPDATE лише переданих полів (назви полів — з коду, не від користувача). */
function updateFields(table: string, id: number, fields: Record<string, unknown>): void {
  const keys = Object.keys(fields).filter((k) => fields[k] !== undefined);
  if (keys.length === 0) return;
  sql(`UPDATE ${table} SET ${keys.map((k) => `${k} = @${k}`).join(', ')} WHERE id = @id`).run({ ...fields, id });
}

// ── Журнал дій ──────────────────────────────────────────────

export interface AdminLogEntry {
  id: number;
  action: string;
  details: string | null;
  created_at: string;
  admin_nickname: string | null;
}

/** Запис у журнал. Викликається в тій самій транзакції, що й зміна. */
export function writeLog(adminId: number | null, action: string, details: string): void {
  sql(`INSERT INTO admin_log (admin_id, action, details) VALUES (?, ?, ?)`).run(adminId, action, details);
}

export function recentLog(limit: number): AdminLogEntry[] {
  const rows = sql(
    `SELECT l.id, l.action, l.details, l.created_at, u.nickname AS admin_nickname
     FROM admin_log l LEFT JOIN users u ON u.id = l.admin_id
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT ?`,
  ).all(limit) as AdminLogEntry[];
  return rows.map((r) => ({ ...r, created_at: isoDateTime(r.created_at) }));
}

// ── Огляд ───────────────────────────────────────────────────

export interface CurrentRate {
  currency: Currency;
  rate: number;
  rate_date: string;
  source: 'nbu' | 'seed';
  fetched_at: string;
}

export function currentRates(): CurrentRate[] {
  const rows = sql(
    `SELECT currency, rate_to_uah AS rate, rate_date, source, fetched_at
     FROM v_current_rates WHERE currency IN ('USD', 'EUR') ORDER BY currency DESC`,
  ).all() as CurrentRate[];
  return rows.map((r) => ({ ...r, fetched_at: isoDateTime(r.fetched_at) }));
}

/** Скільки нагадувань бот надіслав сьогодні (за місцевим часом сервера). */
export function remindersSentToday(): number {
  const row = sql(
    `SELECT count(*) AS n FROM reminders
     WHERE sent_at IS NOT NULL AND date(sent_at, 'localtime') = date('now', 'localtime')`,
  ).get() as { n: number };
  return row.n;
}

export function getStats() {
  const users = sql(
    `SELECT count(*) AS total,
            IFNULL(sum(created_at >= datetime('now', '-30 days')), 0) AS new_30d,
            IFNULL(sum(role = 'admin'), 0) AS admins,
            IFNULL(sum(blocked_at IS NOT NULL), 0) AS blocked,
            IFNULL(sum(telegram_chat_id IS NOT NULL), 0) AS telegram
     FROM users`,
  ).get() as { total: number; new_30d: number; admins: number; blocked: number; telegram: number };

  const { active } = sql(`SELECT count(*) AS active FROM subscriptions WHERE status IN ${ACTIVE_STATUSES}`).get() as {
    active: number;
  };

  const catalog = sql(
    `SELECT (SELECT count(*) FROM categories) AS categories,
            (SELECT count(*) FROM services WHERE owner_user_id IS NULL) AS services,
            (SELECT count(*) FROM plans p JOIN services s ON s.id = p.service_id
              WHERE p.user_id IS NULL AND s.owner_user_id IS NULL) AS plans,
            (SELECT count(*) FROM services WHERE owner_user_id IS NOT NULL) AS custom_services`,
  ).get() as { categories: number; services: number; plans: number; custom_services: number };

  // 7 днів до сьогодні включно; дні без реєстрацій — з нулем.
  const registrations = sql(
    `WITH RECURSIVE days(day) AS (
       SELECT date('now', 'localtime', '-6 days')
       UNION ALL
       SELECT date(day, '+1 day') FROM days WHERE day < date('now', 'localtime')
     )
     SELECT days.day AS date, IFNULL(c.n, 0) AS count
     FROM days
     LEFT JOIN (
       SELECT date(created_at, 'localtime') AS day, count(*) AS n FROM users GROUP BY date(created_at, 'localtime')
     ) c ON c.day = days.day
     ORDER BY days.day`,
  ).all() as Array<{ date: string; count: number }>;

  const topServices = sql(
    `SELECT sv.id, sv.name, IFNULL(sv.icon, '') AS icon, sv.brand_color, count(s.id) AS subscriptions
     FROM subscriptions s
     JOIN plans p     ON p.id = s.plan_id
     JOIN services sv ON sv.id = p.service_id
     WHERE sv.owner_user_id IS NULL
     GROUP BY sv.id
     ORDER BY subscriptions DESC, sv.name
     LIMIT 5`,
  ).all() as Array<{ id: number; name: string; icon: string; brand_color: string; subscriptions: number }>;

  const db = getDb();
  const pageCount = db.pragma('page_count', { simple: true }) as number;
  const pageSize = db.pragma('page_size', { simple: true }) as number;
  const { tables } = sql(
    `SELECT count(*) AS tables FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
  ).get() as { tables: number };

  return {
    users: {
      total: users.total,
      new_30d: users.new_30d,
      admins: users.admins,
      blocked: users.blocked,
      telegram_linked: users.telegram,
    },
    subscriptions: {
      active,
      per_user: users.total > 0 ? Math.round((active / users.total) * 10) / 10 : 0,
    },
    catalog,
    registrations,
    top_services: topServices,
    rates: currentRates(),
    reminders_today: remindersSentToday(),
    database: {
      tables,
      size_bytes: pageCount * pageSize,
      journal_mode: String(db.pragma('journal_mode', { simple: true })),
    },
    log: recentLog(10),
  };
}

// ── Користувачі ─────────────────────────────────────────────

export interface AdminUserRow {
  id: number;
  nickname: string;
  email: string;
  role: Role;
  telegram_linked: boolean;
  telegram_username: string | null;
  created_at: string;
  blocked_at: string | null;
  subscriptions: number;
  active_subscriptions: number;
  custom_services: number;
}

/** Без password_hash, сум, цін і способів оплати — лише облікові дані й кількості. */
const USER_SELECT = `
  SELECT u.id, u.nickname, u.email, u.role, u.telegram_chat_id IS NOT NULL AS telegram_linked,
         u.telegram_username, u.created_at, u.blocked_at,
         (SELECT count(*) FROM subscriptions s WHERE s.user_id = u.id) AS subscriptions,
         (SELECT count(*) FROM subscriptions s WHERE s.user_id = u.id AND s.status IN ${ACTIVE_STATUSES})
           AS active_subscriptions,
         (SELECT count(*) FROM services sv WHERE sv.owner_user_id = u.id) AS custom_services
  FROM users u`;

function toUserRow(r: AdminUserRow): AdminUserRow {
  return {
    ...r,
    telegram_linked: bool(r.telegram_linked),
    created_at: isoDateTime(r.created_at),
    blocked_at: isoDateTime(r.blocked_at),
  };
}

export interface UsersFilter {
  q?: string;
  role?: Role;
  telegram?: 'linked' | 'unlinked';
  status?: 'active' | 'blocked';
  page: number;
}

export function listUsers(f: UsersFilter) {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (f.q) {
    where.push(`(u.nickname LIKE @q ESCAPE '\\' OR u.email LIKE @q ESCAPE '\\')`);
    params.q = likePattern(f.q);
  }
  if (f.role) {
    where.push('u.role = @role');
    params.role = f.role;
  }
  if (f.telegram) where.push(`u.telegram_chat_id IS ${f.telegram === 'linked' ? 'NOT NULL' : 'NULL'}`);
  if (f.status) where.push(`u.blocked_at IS ${f.status === 'blocked' ? 'NOT NULL' : 'NULL'}`);
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

  const { total } = sql(`SELECT count(*) AS total FROM users u ${whereSql}`).get(params) as { total: number };
  const items = (
    sql(`${USER_SELECT} ${whereSql} ORDER BY u.created_at DESC, u.id DESC LIMIT @limit OFFSET @offset`).all({
      ...params,
      limit: ADMIN_PAGE_SIZE,
      offset: (f.page - 1) * ADMIN_PAGE_SIZE,
    }) as AdminUserRow[]
  ).map(toUserRow);

  // Лічильники для чипів «Усі / Активні / Адміністратори / Заблоковані» (без фільтрів).
  const counts = sql(
    `SELECT count(*) AS all_users,
            IFNULL(sum(blocked_at IS NULL), 0) AS active,
            IFNULL(sum(role = 'admin'), 0) AS admins,
            IFNULL(sum(blocked_at IS NOT NULL), 0) AS blocked
     FROM users`,
  ).get() as { all_users: number; active: number; admins: number; blocked: number };

  return {
    items,
    total,
    page: f.page,
    page_size: ADMIN_PAGE_SIZE,
    counts: { all: counts.all_users, active: counts.active, admins: counts.admins, blocked: counts.blocked },
  };
}

export function findAdminUser(id: number): AdminUserRow | undefined {
  const row = sql(`${USER_SELECT} WHERE u.id = ?`).get(id) as AdminUserRow | undefined;
  return row && toUserRow(row);
}

export function setUserRole(id: number, role: Role): void {
  sql(`UPDATE users SET role = ? WHERE id = ?`).run(role, id);
}

export function setUserBlocked(id: number, blocked: boolean): void {
  sql(`UPDATE users SET blocked_at = CASE WHEN ? THEN datetime('now') ELSE NULL END WHERE id = ?`).run(
    blocked ? 1 : 0,
    id,
  );
}

/**
 * Видалення користувача. Підписки — першими: вони посилаються на власні тарифи користувача
 * (ON DELETE RESTRICT), решту прибирає каскад зі схеми.
 */
export function deleteUser(id: number): void {
  sql(`DELETE FROM subscriptions WHERE user_id = ?`).run(id);
  sql(`DELETE FROM users WHERE id = ?`).run(id);
}

// ── Категорії ───────────────────────────────────────────────

export interface AdminCategoryRow {
  id: number;
  slug: string;
  name: string;
  /** Глобальних сервісів у категорії. */
  services: number;
  /** Усіх сервісів, разом із власними сервісами користувачів (вони теж блокують видалення). */
  all_services: number;
}

export function listCategories(): AdminCategoryRow[] {
  return sql(
    `SELECT c.id, c.slug, c.name,
            (SELECT count(*) FROM services s WHERE s.category_id = c.id AND s.owner_user_id IS NULL) AS services,
            (SELECT count(*) FROM services s WHERE s.category_id = c.id) AS all_services
     FROM categories c
     ORDER BY c.slug = 'other', c.id`,
  ).all() as AdminCategoryRow[];
}

export function findCategory(id: number): AdminCategoryRow | undefined {
  return listCategories().find((c) => c.id === id);
}

/** Зайняті назва або slug (без урахування регістру, зокрема кирилиці). */
export function categoryTaken(data: { name?: string; slug?: string }, exceptId?: number): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const c of listCategories()) {
    if (c.id === exceptId) continue;
    if (data.name && c.name.toLocaleLowerCase('uk') === data.name.toLocaleLowerCase('uk')) {
      fields.name = 'Категорія з такою назвою вже є';
    }
    if (data.slug && c.slug === data.slug) fields.slug = 'Такий slug уже використовується';
  }
  return fields;
}

export function insertCategory(data: { name: string; slug: string }): number {
  return Number(sql(`INSERT INTO categories (slug, name) VALUES (@slug, @name)`).run(data).lastInsertRowid);
}

export function updateCategory(id: number, data: { name?: string; slug?: string }): void {
  updateFields('categories', id, { name: data.name, slug: data.slug });
}

export function deleteCategory(id: number): void {
  sql(`DELETE FROM categories WHERE id = ?`).run(id);
}

// ── Сервіси й тарифи глобального каталогу ───────────────────

export interface AdminPlanRow {
  id: number;
  service_id: number;
  name: string;
  price: number;
  currency: Currency;
  billing_period: BillingPeriod;
  subscriptions: number;
}

export interface AdminServiceRow {
  id: number;
  name: string;
  icon: string | null;
  brand_color: string;
  website: string | null;
  category_id: number;
  category: string;
  plans_count: number;
  subscriptions: number;
  plans: AdminPlanRow[];
}

const SERVICE_SELECT = `
  SELECT sv.id, sv.name, sv.icon, sv.brand_color, sv.website, sv.category_id, c.name AS category,
         (SELECT count(*) FROM plans p WHERE p.service_id = sv.id AND p.user_id IS NULL) AS plans_count,
         (SELECT count(*) FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE p.service_id = sv.id)
           AS subscriptions
  FROM services sv JOIN categories c ON c.id = sv.category_id`;

/** Глобальні тарифи переданих сервісів із кількістю підписок на кожен. */
function plansFor(serviceIds: number[]): Map<number, AdminPlanRow[]> {
  const rows = sql(
    `SELECT p.id, p.service_id, p.name, p.price, p.currency, p.billing_period,
            (SELECT count(*) FROM subscriptions s WHERE s.plan_id = p.id) AS subscriptions
     FROM plans p
     WHERE p.user_id IS NULL AND p.service_id IN (SELECT value FROM json_each(?))
     ORDER BY p.price, p.id`,
  ).all(JSON.stringify(serviceIds)) as AdminPlanRow[];
  const map = new Map<number, AdminPlanRow[]>();
  for (const r of rows) map.set(r.service_id, [...(map.get(r.service_id) ?? []), r]);
  return map;
}

type ServiceBase = Omit<AdminServiceRow, 'plans'>;

export function listServices(f: { q?: string; category?: number; page: number }) {
  const where = ['sv.owner_user_id IS NULL'];
  const params: Record<string, unknown> = {};
  if (f.q) {
    where.push(`sv.name LIKE @q ESCAPE '\\'`);
    params.q = likePattern(f.q);
  }
  if (f.category) {
    where.push('sv.category_id = @category');
    params.category = f.category;
  }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const { total } = sql(`SELECT count(*) AS total FROM services sv ${whereSql}`).get(params) as { total: number };
  const rows = sql(
    `${SERVICE_SELECT} ${whereSql} ORDER BY subscriptions DESC, sv.name LIMIT @limit OFFSET @offset`,
  ).all({ ...params, limit: ADMIN_PAGE_SIZE, offset: (f.page - 1) * ADMIN_PAGE_SIZE }) as ServiceBase[];
  const plans = plansFor(rows.map((r) => r.id));

  const summary = sql(
    `SELECT (SELECT count(*) FROM categories) AS categories,
            (SELECT count(*) FROM services WHERE owner_user_id IS NULL) AS services,
            (SELECT count(*) FROM plans p JOIN services s ON s.id = p.service_id
              WHERE p.user_id IS NULL AND s.owner_user_id IS NULL) AS plans`,
  ).get() as { categories: number; services: number; plans: number };

  return {
    items: rows.map((r) => ({ ...r, plans: plans.get(r.id) ?? [] })),
    total,
    page: f.page,
    page_size: ADMIN_PAGE_SIZE,
    summary,
  };
}

/** Лише глобальний сервіс (власні сервіси користувачів адмін не редагує). */
export function findService(id: number): AdminServiceRow | undefined {
  const row = sql(`${SERVICE_SELECT} WHERE sv.id = ? AND sv.owner_user_id IS NULL`).get(id) as ServiceBase | undefined;
  return row && { ...row, plans: plansFor([row.id]).get(row.id) ?? [] };
}

/** Назва глобального сервісу вже зайнята (без урахування регістру, зокрема кирилиці). */
export function serviceNameTaken(name: string, exceptId?: number): boolean {
  const lower = name.toLocaleLowerCase('uk');
  const rows = sql(`SELECT id, name FROM services WHERE owner_user_id IS NULL`).all() as Array<{
    id: number;
    name: string;
  }>;
  return rows.some((r) => r.id !== exceptId && r.name.toLocaleLowerCase('uk') === lower);
}

export interface ServiceFields {
  name: string;
  category_id: number;
  website: string | null;
  brand_color: string;
  icon: string | null;
}

export function insertService(data: ServiceFields): number {
  return Number(
    sql(
      `INSERT INTO services (category_id, owner_user_id, name, icon, brand_color, website)
       VALUES (@category_id, NULL, @name, @icon, @brand_color, @website)`,
    ).run(data).lastInsertRowid,
  );
}

export function updateService(id: number, data: Partial<ServiceFields>): void {
  updateFields('services', id, { ...data });
}

/** Скільки підписок (усіх користувачів) на будь-який тариф сервісу. */
export function serviceSubscriptions(id: number): number {
  const row = sql(
    `SELECT count(*) AS n FROM subscriptions s JOIN plans p ON p.id = s.plan_id WHERE p.service_id = ?`,
  ).get(id) as { n: number };
  return row.n;
}

/** Разом із сервісом видаляються його тарифи (ON DELETE CASCADE). */
export function deleteService(id: number): void {
  sql(`DELETE FROM services WHERE id = ?`).run(id);
}

export interface PlanFields {
  name: string;
  price: number;
  currency: Currency;
  billing_period: BillingPeriod;
}

/** Лише глобальний тариф глобального сервісу. */
export function findPlan(id: number): (AdminPlanRow & { service_name: string }) | undefined {
  return sql(
    `SELECT p.id, p.service_id, p.name, p.price, p.currency, p.billing_period, sv.name AS service_name,
            (SELECT count(*) FROM subscriptions s WHERE s.plan_id = p.id) AS subscriptions
     FROM plans p JOIN services sv ON sv.id = p.service_id
     WHERE p.id = ? AND p.user_id IS NULL AND sv.owner_user_id IS NULL`,
  ).get(id) as (AdminPlanRow & { service_name: string }) | undefined;
}

export function insertPlan(serviceId: number, data: PlanFields): number {
  return Number(
    sql(
      `INSERT INTO plans (service_id, user_id, name, price, currency, billing_period)
       VALUES (@service_id, NULL, @name, @price, @currency, @billing_period)`,
    ).run({ ...data, service_id: serviceId }).lastInsertRowid,
  );
}

export function updatePlan(id: number, data: Partial<PlanFields>): void {
  updateFields('plans', id, { ...data });
}

export function deletePlan(id: number): void {
  sql(`DELETE FROM plans WHERE id = ?`).run(id);
}

// ── Власні сервіси користувачів ─────────────────────────────

/** Згруповані за назвою: підказка, що варто додати в глобальний каталог. */
export function listCustomServices() {
  return sql(
    `SELECT min(sv.name) AS name,
            count(DISTINCT sv.owner_user_id) AS users,
            group_concat(DISTINCT c.name) AS categories,
            (SELECT count(*) FROM subscriptions s JOIN plans p ON p.id = s.plan_id
              JOIN services x ON x.id = p.service_id
              WHERE x.owner_user_id IS NOT NULL AND x.name = sv.name COLLATE NOCASE) AS subscriptions
     FROM services sv JOIN categories c ON c.id = sv.category_id
     WHERE sv.owner_user_id IS NOT NULL
     GROUP BY sv.name COLLATE NOCASE
     ORDER BY users DESC, name`,
  ).all() as Array<{ name: string; users: number; categories: string; subscriptions: number }>;
}

// ── Нагадування ─────────────────────────────────────────────

export function recentReminders(limit: number) {
  const rows = sql(
    `SELECT r.id, r.sent_at, r.due_date, r.days_before, u.nickname,
            sv.name AS service_name, IFNULL(sv.icon, '') AS icon, sv.brand_color
     FROM reminders r
     JOIN subscriptions s ON s.id = r.subscription_id
     JOIN users u         ON u.id = s.user_id
     JOIN plans p         ON p.id = s.plan_id
     JOIN services sv     ON sv.id = p.service_id
     WHERE r.sent_at IS NOT NULL
     ORDER BY r.sent_at DESC, r.id DESC
     LIMIT ?`,
  ).all(limit) as Array<{
    id: number;
    sent_at: string;
    due_date: string;
    days_before: number;
    nickname: string;
    service_name: string;
    icon: string;
    brand_color: string;
  }>;
  return rows.map((r) => ({ ...r, sent_at: isoDateTime(r.sent_at) }));
}
