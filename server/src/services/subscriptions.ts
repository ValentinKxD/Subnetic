import { addPeriod, todayISO } from '../../../shared/dates.js';
import type {
  SubscriptionCreateInput,
  SubscriptionQuery,
  SubscriptionStatus,
  SubscriptionUpdateInput,
} from '../../../shared/domain.js';
import { toMonthly } from '../../../shared/money.js';
import { findVisiblePlan } from '../db/catalog.js';
import { findPaymentMethod } from '../db/paymentMethods.js';
import { findPayment, insertPayment } from '../db/payments.js';
import {
  deleteSubscription,
  findSubscriptionDetails,
  insertSubscription,
  listSubscriptionDetails,
  updateSubscription,
} from '../db/subscriptions.js';
import { transaction } from '../db/index.js';
import type { BillingPeriod, Plan, Subscription, SubscriptionDetails, SubscriptionDTO, UserContext } from '../types.js';
import { toUserCurrency } from './context.js';
import { badRequest, conflict, notFound } from './errors.js';
import { paymentToDTO } from './schedule.js';

/** Підписка, що генерує списання: активна або пробна з автопродовженням. */
export function isBillable(sub: Pick<Subscription, 'status' | 'auto_renew'>): boolean {
  return sub.status === 'active' || (sub.status === 'trial' && sub.auto_renew);
}

export function toSubscriptionDTO(s: SubscriptionDetails, ctx: UserContext): SubscriptionDTO {
  return {
    id: s.id,
    status: s.status,
    start_date: s.start_date,
    trial_end_date: s.trial_end_date,
    next_payment_date: s.next_payment_date,
    auto_renew: s.auto_renew,
    plan: {
      id: s.plan.id,
      name: s.plan.name,
      price: s.plan.price,
      currency: s.plan.currency,
      billing_period: s.plan.billing_period,
    },
    service: {
      id: s.service.id,
      name: s.service.name,
      icon: s.service.icon ?? '',
      brand_color: s.service.brand_color,
      category_id: s.service.category_id,
      category: s.category_name,
    },
    payment_method_id: s.payment_method_id,
    payment_method: s.payment_method_label,
    converted_price: toUserCurrency(ctx, s.plan.price, s.plan.currency),
    monthly_amount: toUserCurrency(ctx, toMonthly(s.plan.price, s.plan.billing_period), s.plan.currency),
    display_currency: ctx.currency,
  };
}

// ── Графік ──────────────────────────────────────────────────

/** Перша дата списання, не раніша за `from`, у сітці start + k·period. */
export function firstPaymentOnOrAfter(start: string, period: BillingPeriod, from: string): string {
  let d = start;
  let k = 0;
  while (d < from) {
    k += 1;
    d = addPeriod(start, period, k);
  }
  return d;
}

/** Початковий статус і next_payment_date нової підписки. */
export function initialSchedule(
  start: string,
  trialEnd: string | null,
  period: BillingPeriod,
): { status: SubscriptionStatus; next_payment_date: string } {
  const today = todayISO();
  if (trialEnd && trialEnd > today) return { status: 'trial', next_payment_date: trialEnd };
  return { status: 'active', next_payment_date: firstPaymentOnOrAfter(trialEnd ?? start, period, today) };
}

type Writable = Omit<Subscription, 'id' | 'user_id' | 'cancelled_at'>;

function writableOf(s: Subscription): Writable {
  return {
    plan_id: s.plan_id,
    payment_method_id: s.payment_method_id,
    status: s.status,
    start_date: s.start_date,
    trial_end_date: s.trial_end_date,
    next_payment_date: s.next_payment_date,
    auto_renew: s.auto_renew,
    note: s.note,
  };
}

/** Оновлює графік платежів після зміни статусу */
function applyStatus(sub: Writable, prev: SubscriptionStatus, period: BillingPeriod, status: SubscriptionStatus): void {
  sub.status = status;
  if (status === 'paused' || status === 'cancelled' || status === 'expired') {
    sub.next_payment_date = null;
    if (status !== 'paused') sub.auto_renew = false;
    return;
  }
  if (status === 'active' && (prev !== 'active' || !sub.next_payment_date)) {
    const today = todayISO();
    if (!sub.next_payment_date || sub.next_payment_date < today) {
      sub.next_payment_date = firstPaymentOnOrAfter(sub.trial_end_date ?? sub.start_date, period, today);
    }
    sub.auto_renew = true;
  }
  if (status === 'trial' && !sub.next_payment_date) sub.next_payment_date = sub.trial_end_date;
}

// ── Перевірки належності ────────────────────────────────────

function visiblePlanOrThrow(userId: number, planId: number): Plan {
  const plan = findVisiblePlan(userId, planId);
  if (!plan) throw badRequest('Невідомий тариф', { plan_id: 'Оберіть тариф' });
  return plan;
}

function checkPaymentMethod(userId: number, id: number | null | undefined): void {
  if (id === null || id === undefined || findPaymentMethod(userId, id)) return;
  throw badRequest('Невідомий спосіб оплати', { payment_method_id: 'Оберіть спосіб оплати' });
}

function detailsOrThrow(userId: number, id: number): SubscriptionDetails {
  const sub = findSubscriptionDetails(userId, id);
  if (!sub) throw notFound('Підписку');
  return sub;
}

// ── Операції ────────────────────────────────────────────────

const STATUS_ORDER: Record<SubscriptionStatus, number> = { trial: 0, active: 0, paused: 1, cancelled: 2, expired: 3 };

export function querySubscriptions(ctx: UserContext, query: SubscriptionQuery & { sort: string }) {
  const all = listSubscriptionDetails(ctx.userId).map((s) => toSubscriptionDTO(s, ctx));

  const q = query.q?.toLocaleLowerCase('uk');
  const filtered = all.filter(
    (s) =>
      (!q || s.service.name.toLocaleLowerCase('uk').includes(q) || s.plan.name.toLocaleLowerCase('uk').includes(q)) &&
      (!query.category || s.service.category_id === query.category),
  );

  // Лічильники для вкладок статусів — з урахуванням пошуку й категорії, але без фільтра статусу.
  const counts: Record<SubscriptionStatus | 'all', number> = {
    all: filtered.length,
    trial: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
    expired: 0,
  };
  filtered.forEach((s) => (counts[s.status] += 1));

  const items = filtered.filter((s) => !query.status || s.status === query.status);
  items.sort((a, b) => {
    switch (query.sort) {
      case 'name':
        return a.service.name.localeCompare(b.service.name, 'uk');
      case 'price_desc':
        return b.monthly_amount - a.monthly_amount;
      case 'price_asc':
        return a.monthly_amount - b.monthly_amount;
      default: {
        // Спершу ті, що мають дату платежу (за датою), далі решта за статусом.
        if (a.next_payment_date && b.next_payment_date) return a.next_payment_date.localeCompare(b.next_payment_date);
        if (a.next_payment_date) return -1;
        if (b.next_payment_date) return 1;
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.service.name.localeCompare(b.service.name, 'uk');
      }
    }
  });

  return { items, counts, currency: ctx.currency };
}

export function createSubscription(ctx: UserContext, data: SubscriptionCreateInput): SubscriptionDTO {
  const plan = visiblePlanOrThrow(ctx.userId, data.plan_id);
  checkPaymentMethod(ctx.userId, data.payment_method_id);
  const { status, next_payment_date } = initialSchedule(data.start_date, data.trial_end_date, plan.billing_period);
  const id = insertSubscription(ctx.userId, {
    plan_id: plan.id,
    payment_method_id: data.payment_method_id,
    status,
    start_date: data.start_date,
    trial_end_date: data.trial_end_date,
    next_payment_date,
    auto_renew: data.auto_renew,
    note: null,
  });
  return toSubscriptionDTO(detailsOrThrow(ctx.userId, id), ctx);
}

export function updateSubscriptionById(ctx: UserContext, id: number, data: SubscriptionUpdateInput): SubscriptionDTO {
  const current = detailsOrThrow(ctx.userId, id);
  let period = current.plan.billing_period;

  const next = writableOf(current);

  if (data.plan_id !== undefined) {
    const plan = visiblePlanOrThrow(ctx.userId, data.plan_id);
    next.plan_id = plan.id;
    period = plan.billing_period;
  }
  checkPaymentMethod(ctx.userId, data.payment_method_id);
  if (data.payment_method_id !== undefined) next.payment_method_id = data.payment_method_id;
  if (data.start_date !== undefined) next.start_date = data.start_date;
  if (data.trial_end_date !== undefined) next.trial_end_date = data.trial_end_date;
  if (data.auto_renew !== undefined) next.auto_renew = data.auto_renew;
  if (data.next_payment_date !== undefined) next.next_payment_date = data.next_payment_date;

  if (next.trial_end_date && next.trial_end_date <= next.start_date) {
    throw badRequest('Перевірте дати', { trial_end_date: 'Кінець пробного періоду має бути після дати початку' });
  }

  // Зміна дат/тарифу без явного статусу й дати: перераховуємо графік, як при створенні.
  const scheduleChanged = data.start_date !== undefined || data.trial_end_date !== undefined || data.plan_id !== undefined;
  if (
    scheduleChanged &&
    data.next_payment_date === undefined &&
    data.status === undefined &&
    (next.status === 'active' || next.status === 'trial')
  ) {
    const s = initialSchedule(next.start_date, next.trial_end_date, period);
    next.status = s.status;
    next.next_payment_date = s.next_payment_date;
  }
  if (data.status !== undefined && data.status !== current.status) applyStatus(next, current.status, period, data.status);

  updateSubscription(ctx.userId, id, next);
  return toSubscriptionDTO(detailsOrThrow(ctx.userId, id), ctx);
}

export function removeSubscription(userId: number, id: number): void {
  if (!deleteSubscription(userId, id)) throw notFound('Підписку');
}

/** Позначити найближчий платіж оплаченим */
export function paySubscription(ctx: UserContext, id: number) {
  return transaction(() => {
    const sub = detailsOrThrow(ctx.userId, id);
    if (!sub.next_payment_date || !isBillable(sub)) {
      throw conflict('Для цієї підписки немає очікуваного платежу');
    }
    const paymentId = insertPayment({
      subscription_id: sub.id,
      amount: sub.plan.price,
      currency: sub.plan.currency,
      due_date: sub.next_payment_date,
      status: 'paid',
      payment_method_id: sub.payment_method_id,
    });

    if (!sub.auto_renew) {
      const after = writableOf(detailsOrThrow(ctx.userId, id));
      updateSubscription(ctx.userId, id, { ...after, status: 'expired', next_payment_date: null });
    }

    const payment = findPayment(ctx.userId, paymentId);
    if (!payment) throw notFound('Платіж');
    return {
      payment: paymentToDTO(payment, ctx),
      subscription: toSubscriptionDTO(detailsOrThrow(ctx.userId, id), ctx),
    };
  });
}
