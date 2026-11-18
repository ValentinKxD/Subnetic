import { randomBytes } from 'node:crypto';
import type { PublicUser } from '../../../shared/auth.js';
import { addPeriod, todayISO } from '../../../shared/dates.js';
import * as seed from './seed.js';
import type { Category, Payment, PaymentMethod, Plan, Service, Settings, Subscription, User } from './types.js';

/**
 * In-memory сховище — тимчасова заглушка замість бази даних.
 * Дані копіюються з seed і живуть до перезапуску сервера.
 * Пізніше цей модуль буде замінено на шар доступу до SQLite з тим самим інтерфейсом.
 */
export const db: {
  categories: Category[];
  services: Service[];
  plans: Plan[];
  users: User[];
  paymentMethods: PaymentMethod[];
  subscriptions: Subscription[];
  payments: Payment[];
  settings: Settings[];
} = {
  categories: structuredClone(seed.categories),
  services: structuredClone(seed.services),
  plans: structuredClone(seed.plans),
  users: structuredClone(seed.users),
  paymentMethods: structuredClone(seed.paymentMethods),
  subscriptions: seed.subscriptions.map(({ history_until: _h, ...s }) => ({ ...s })),
  payments: [],
  settings: structuredClone(seed.settings),
};

function nextId(rows: Array<{ id: number }>): number {
  return rows.reduce((max, r) => Math.max(max, r.id), 0) + 1;
}

// ── Довідники ───────────────────────────────────────────────

export function findCategory(id: number): Category | undefined {
  return db.categories.find((c) => c.id === id);
}

export function findService(id: number): Service | undefined {
  return db.services.find((s) => s.id === id);
}

export function findPlan(id: number): Plan | undefined {
  return db.plans.find((p) => p.id === id);
}

/** Сервіс/тариф доступний користувачу: глобальний або власний. */
export function isVisibleTo(row: { owner_id: number | null }, userId: number): boolean {
  return row.owner_id === null || row.owner_id === userId;
}

export function createService(data: Omit<Service, 'id'>): Service {
  const s: Service = { ...data, id: nextId(db.services) };
  db.services.push(s);
  return s;
}

export function createPlan(data: Omit<Plan, 'id'>): Plan {
  const p: Plan = { ...data, id: nextId(db.plans) };
  db.plans.push(p);
  return p;
}

// ── Користувачі ─────────────────────────────────────────────

export function getUserById(id: number): User | undefined {
  return db.users.find((u) => u.id === id);
}

export function findUserByEmail(email: string): User | undefined {
  const e = email.toLowerCase();
  return db.users.find((u) => u.email === e);
}

export function findUserByNickname(nickname: string): User | undefined {
  const n = nickname.toLowerCase();
  return db.users.find((u) => u.nickname.toLowerCase() === n);
}

/** Вхід за email або нікнеймом. */
export function findUserByIdentifier(identifier: string): User | undefined {
  const id = identifier.trim();
  return id.includes('@') ? findUserByEmail(id) : findUserByNickname(id);
}

export function createUser(data: { nickname: string; email: string; phone?: string; password: string }): User {
  const user: User = {
    id: nextId(db.users),
    nickname: data.nickname,
    email: data.email.toLowerCase(),
    phone: data.phone ?? null,
    password: data.password,
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  getSettings(user.id); // налаштування за замовчуванням
  return user;
}

export function updateUser(id: number, patch: Partial<Pick<User, 'nickname' | 'email' | 'phone'>>): User | undefined {
  const user = getUserById(id);
  if (!user) return undefined;
  Object.assign(user, patch);
  return user;
}

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, nickname: u.nickname, email: u.email, phone: u.phone };
}

// ── Налаштування ────────────────────────────────────────────

export function getSettings(userId: number): Settings {
  let s = db.settings.find((x) => x.user_id === userId);
  if (!s) {
    s = {
      user_id: userId,
      currency: 'UAH',
      theme: 'light',
      remind_7: true,
      remind_3: true,
      remind_1: true,
      remind_hour: 9,
      telegram_username: null,
      telegram_linked_at: null,
    };
    db.settings.push(s);
  }
  return s;
}

// ── Способи оплати ──────────────────────────────────────────

export function listPaymentMethods(userId: number): PaymentMethod[] {
  return db.paymentMethods.filter((m) => m.user_id === userId);
}

export function findPaymentMethod(userId: number, id: number): PaymentMethod | undefined {
  return db.paymentMethods.find((m) => m.id === id && m.user_id === userId);
}

export function createPaymentMethod(userId: number, data: Omit<PaymentMethod, 'id' | 'user_id'>): PaymentMethod {
  const own = listPaymentMethods(userId);
  // Перший спосіб оплати автоматично стає основним.
  const isDefault = data.is_default || own.length === 0;
  if (isDefault) own.forEach((m) => (m.is_default = false));
  const m: PaymentMethod = { ...data, is_default: isDefault, id: nextId(db.paymentMethods), user_id: userId };
  db.paymentMethods.push(m);
  return m;
}

export function updatePaymentMethod(
  userId: number,
  id: number,
  patch: Partial<Omit<PaymentMethod, 'id' | 'user_id'>>,
): PaymentMethod | undefined {
  const m = findPaymentMethod(userId, id);
  if (!m) return undefined;
  if (patch.is_default) listPaymentMethods(userId).forEach((x) => (x.is_default = false));
  // Зняти «основний» з єдиного основного не можна — він лишається.
  const { is_default, ...rest } = patch;
  Object.assign(m, rest);
  if (is_default) m.is_default = true;
  return m;
}

export function deletePaymentMethod(userId: number, id: number): boolean {
  const idx = db.paymentMethods.findIndex((m) => m.id === id && m.user_id === userId);
  if (idx === -1) return false;
  const [removed] = db.paymentMethods.splice(idx, 1);
  db.subscriptions.forEach((s) => {
    if (s.payment_method_id === id) s.payment_method_id = null;
  });
  if (removed?.is_default) {
    const first = listPaymentMethods(userId)[0];
    if (first) first.is_default = true;
  }
  return true;
}

export function paymentMethodLabel(userId: number, id: number | null): string | null {
  return id === null ? null : (findPaymentMethod(userId, id)?.label ?? null);
}

// ── Підписки ────────────────────────────────────────────────

export function listSubscriptions(userId: number): Subscription[] {
  return db.subscriptions.filter((s) => s.user_id === userId);
}

export function findSubscription(userId: number, id: number): Subscription | undefined {
  return db.subscriptions.find((s) => s.id === id && s.user_id === userId);
}

export function createSubscription(data: Omit<Subscription, 'id' | 'created_at'>): Subscription {
  const s: Subscription = { ...data, id: nextId(db.subscriptions), created_at: new Date().toISOString() };
  db.subscriptions.push(s);
  return s;
}

export function deleteSubscription(userId: number, id: number): boolean {
  const idx = db.subscriptions.findIndex((s) => s.id === id && s.user_id === userId);
  if (idx === -1) return false;
  db.subscriptions.splice(idx, 1);
  // Історія платежів лишається (зі знімком назв), але без посилання на підписку.
  db.payments.forEach((p) => {
    if (p.subscription_id === id) p.subscription_id = null;
  });
  return true;
}

// ── Платежі ─────────────────────────────────────────────────

export function listPayments(userId: number): Payment[] {
  return db.payments.filter((p) => p.user_id === userId);
}

/** Створює запис платежу зі знімком назв сервісу, тарифу і способу оплати. */
export function recordPayment(
  sub: Subscription,
  opts: { due_date: string; paid_at: string; status?: Payment['status'] },
): Payment {
  const plan = findPlan(sub.plan_id);
  const service = plan ? findService(plan.service_id) : undefined;
  if (!plan || !service) throw new Error('Підписка посилається на неіснуючий тариф');
  const p: Payment = {
    id: nextId(db.payments),
    user_id: sub.user_id,
    subscription_id: sub.id,
    amount: plan.price,
    currency: plan.currency,
    due_date: opts.due_date,
    paid_at: opts.paid_at,
    status: opts.status ?? 'paid',
    service_name: service.name,
    service_icon: service.icon,
    brand_color: service.brand_color,
    plan_name: plan.name,
    billing_period: plan.billing_period,
    payment_method: paymentMethodLabel(sub.user_id, sub.payment_method_id),
  };
  db.payments.push(p);
  return p;
}

/** Історія демо-даних: кожен період від початку (або кінця пробного) до history_until. */
function generateSeedHistory(): void {
  const today = todayISO();
  for (const s of seed.subscriptions) {
    if (!s.history_until) continue;
    const plan = findPlan(s.plan_id);
    const sub = db.subscriptions.find((x) => x.id === s.id);
    if (!plan || !sub) continue;
    let d = s.trial_end_date ?? s.start_date;
    while (d < s.history_until && d <= today) {
      recordPayment(sub, { due_date: d, paid_at: d });
      d = addPeriod(d, plan.billing_period);
    }
  }
  // Кілька нетипових статусів для історії.
  const spotify = db.payments.filter((p) => p.subscription_id === 2);
  const failed = spotify[spotify.length - 3];
  if (failed) failed.status = 'failed';
  const coursera = db.payments.filter((p) => p.subscription_id === 7);
  const refunded = coursera[coursera.length - 1];
  if (refunded) refunded.status = 'refunded';
}
generateSeedHistory();

// ── Токени ──────────────────────────────────────────────────
// ЗАГЛУШКА: випадковий рядок у пам'яті (token → userId). На реальному бекенді — JWT.

const tokens = new Map<string, number>();

export function createToken(userId: number): string {
  const token = randomBytes(32).toString('hex');
  tokens.set(token, userId);
  return token;
}

export function getUserIdByToken(token: string | undefined): number | undefined {
  return token ? tokens.get(token) : undefined;
}

export function deleteToken(token: string | undefined): void {
  if (token) tokens.delete(token);
}
