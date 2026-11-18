import { addPeriod, todayISO } from '../../../shared/dates.js';
import type { SubscriptionQuery, SubscriptionStatus } from '../../../shared/domain.js';
import { convert, round2, toMonthly, type Currency } from '../../../shared/money.js';
import {
  findCategory,
  findPlan,
  findService,
  listSubscriptions,
  paymentMethodLabel,
} from '../data/store.js';
import type { Plan, Service, ServiceRef, Subscription, SubscriptionDTO } from '../data/types.js';

export function serviceRef(service: Service): ServiceRef {
  return {
    id: service.id,
    name: service.name,
    icon: service.icon,
    brand_color: service.brand_color,
    category_id: service.category_id,
    category: findCategory(service.category_id)?.name ?? 'Інше',
  };
}

export function planAndService(sub: Subscription): { plan: Plan; service: Service } | null {
  const plan = findPlan(sub.plan_id);
  const service = plan ? findService(plan.service_id) : undefined;
  return plan && service ? { plan, service } : null;
}

/** Підписка, що генерує списання: активна або пробна з автопродовженням. */
export function isBillable(sub: Subscription): boolean {
  return sub.status === 'active' || (sub.status === 'trial' && sub.auto_renew);
}

export function monthlyAmount(plan: Plan, currency: Currency): number {
  return convert(toMonthly(plan.price, plan.billing_period), plan.currency, currency);
}

export function toSubscriptionDTO(sub: Subscription, currency: Currency): SubscriptionDTO | null {
  const ps = planAndService(sub);
  if (!ps) return null;
  const { plan, service } = ps;
  return {
    id: sub.id,
    status: sub.status,
    start_date: sub.start_date,
    trial_end_date: sub.trial_end_date,
    next_payment_date: sub.next_payment_date,
    auto_renew: sub.auto_renew,
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      billing_period: plan.billing_period,
    },
    service: serviceRef(service),
    payment_method_id: sub.payment_method_id,
    payment_method: paymentMethodLabel(sub.user_id, sub.payment_method_id),
    converted_price: round2(convert(plan.price, plan.currency, currency)),
    monthly_amount: round2(monthlyAmount(plan, currency)),
    display_currency: currency,
  };
}

/** Перша дата списання, не раніша за `from`, у сітці start + k·period. */
export function firstPaymentOnOrAfter(start: string, period: Plan['billing_period'], from: string): string {
  let d = start;
  let k = 0;
  while (d < from) {
    k += 1;
    d = addPeriod(start, period, k);
  }
  return d;
}

/** Початковий next_payment_date і статус для нової підписки. */
export function initialSchedule(
  start: string,
  trialEnd: string | null,
  period: Plan['billing_period'],
): { status: SubscriptionStatus; next_payment_date: string } {
  const today = todayISO();
  if (trialEnd && trialEnd > today) return { status: 'trial', next_payment_date: trialEnd };
  const anchor = trialEnd ?? start;
  return { status: 'active', next_payment_date: firstPaymentOnOrAfter(anchor, period, today) };
}

/**
 * Наслідки зміни статусу для графіка платежів:
 * - paused / cancelled / expired: майбутніх списань немає;
 * - відновлення (active): наступний платіж — найближча дата сітки від сьогодні.
 */
export function applyStatus(sub: Subscription, plan: Plan, status: SubscriptionStatus): void {
  const prev = sub.status;
  sub.status = status;
  if (status === 'paused' || status === 'cancelled' || status === 'expired') {
    sub.next_payment_date = null;
    if (status !== 'paused') sub.auto_renew = false;
    return;
  }
  if (status === 'active' && (prev !== 'active' || !sub.next_payment_date)) {
    const today = todayISO();
    if (!sub.next_payment_date || sub.next_payment_date < today) {
      sub.next_payment_date = firstPaymentOnOrAfter(sub.trial_end_date ?? sub.start_date, plan.billing_period, today);
    }
    sub.auto_renew = true;
  }
  if (status === 'trial' && !sub.next_payment_date) {
    sub.next_payment_date = sub.trial_end_date;
  }
}

const STATUS_ORDER: Record<SubscriptionStatus, number> = { trial: 0, active: 0, paused: 1, cancelled: 2, expired: 3 };

export function querySubscriptions(userId: number, currency: Currency, query: SubscriptionQuery & { sort: string }) {
  const all = listSubscriptions(userId)
    .map((s) => toSubscriptionDTO(s, currency))
    .filter((s): s is SubscriptionDTO => s !== null);

  const q = query.q?.toLowerCase();
  const filteredNoStatus = all.filter(
    (s) =>
      (!q || s.service.name.toLowerCase().includes(q) || s.plan.name.toLowerCase().includes(q)) &&
      (!query.category || s.service.category_id === query.category),
  );

  const counts: Record<SubscriptionStatus | 'all', number> = {
    all: filteredNoStatus.length,
    trial: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
    expired: 0,
  };
  filteredNoStatus.forEach((s) => (counts[s.status] += 1));

  const items = filteredNoStatus.filter((s) => !query.status || s.status === query.status);

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
        const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (a.next_payment_date && b.next_payment_date) return a.next_payment_date.localeCompare(b.next_payment_date);
        if (a.next_payment_date) return -1;
        if (b.next_payment_date) return 1;
        return byStatus || a.service.name.localeCompare(b.service.name, 'uk');
      }
    }
  });

  return { items, counts, currency };
}
