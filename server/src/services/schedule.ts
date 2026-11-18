import { addPeriod, todayISO } from '../../../shared/dates.js';
import { convert, round2, type Currency } from '../../../shared/money.js';
import { listPayments, listSubscriptions, paymentMethodLabel } from '../data/store.js';
import type { CalendarItem, Payment, PaymentDTO, Subscription } from '../data/types.js';
import { isBillable, planAndService } from './subscriptions.js';

/**
 * Графік платежів. Майбутні платежі НЕ зберігаються — їх обчислюємо
 * з next_payment_date і періоду тарифу. Минулі беруться з таблиці платежів.
 */

/** Обчислені очікувані списання підписки в межах [from, to]. */
export function expectedForSubscription(sub: Subscription, from: string, to: string, currency: Currency): CalendarItem[] {
  if (!isBillable(sub) || !sub.next_payment_date) return [];
  const ps = planAndService(sub);
  if (!ps) return [];
  const { plan, service } = ps;
  const today = todayISO();
  const items: CalendarItem[] = [];

  let d = sub.next_payment_date;
  let first = true;
  // Без автопродовження списань після найближчого немає.
  while (d <= to) {
    if (d >= from) {
      items.push({
        key: `s-${sub.id}-${d}`,
        kind: 'expected',
        date: d,
        subscription_id: sub.id,
        service: { name: service.name, icon: service.icon, brand_color: service.brand_color },
        plan_name: plan.name,
        billing_period: plan.billing_period,
        amount: plan.price,
        currency: plan.currency,
        converted_amount: round2(convert(plan.price, plan.currency, currency)),
        payment_method: paymentMethodLabel(sub.user_id, sub.payment_method_id),
        payment_status: null,
        overdue: d < today,
        trial_end: first && sub.status === 'trial',
        payable: first,
      });
    }
    if (!sub.auto_renew) break;
    d = addPeriod(d, plan.billing_period);
    first = false;
  }
  return items;
}

export function paymentToItem(p: Payment, currency: Currency): CalendarItem {
  return {
    key: `p-${p.id}`,
    kind: 'paid',
    date: p.due_date,
    subscription_id: p.subscription_id,
    service: { name: p.service_name, icon: p.service_icon, brand_color: p.brand_color },
    plan_name: p.plan_name,
    billing_period: p.billing_period,
    amount: p.amount,
    currency: p.currency,
    converted_amount: round2(convert(p.amount, p.currency, currency)),
    payment_method: p.payment_method,
    payment_status: p.status,
    overdue: false,
    trial_end: false,
    payable: false,
  };
}

export function paymentToDTO(p: Payment, currency: Currency): PaymentDTO {
  return {
    id: p.id,
    subscription_id: p.subscription_id,
    date: p.due_date,
    paid_at: p.paid_at,
    status: p.status,
    amount: p.amount,
    currency: p.currency,
    converted_amount: round2(convert(p.amount, p.currency, currency)),
    service: { name: p.service_name, icon: p.service_icon, brand_color: p.brand_color },
    plan_name: p.plan_name,
    billing_period: p.billing_period,
    payment_method: p.payment_method,
  };
}

/** Усі платежі (минулі + обчислені майбутні) у діапазоні дат, відсортовані за датою. */
export function scheduleBetween(userId: number, from: string, to: string, currency: Currency): CalendarItem[] {
  const past = listPayments(userId)
    .filter((p) => p.due_date >= from && p.due_date <= to)
    .map((p) => paymentToItem(p, currency));
  const future = listSubscriptions(userId).flatMap((s) => expectedForSubscription(s, from, to, currency));
  return [...past, ...future].sort((a, b) => a.date.localeCompare(b.date) || a.service.name.localeCompare(b.service.name, 'uk'));
}

/** Сума «сплачено» (лише успішні) і «очікується» в наборі елементів. */
export function summarize(items: CalendarItem[]): { paid: number; expected: number } {
  let paid = 0;
  let expected = 0;
  for (const i of items) {
    if (i.kind === 'paid' && i.payment_status === 'paid') paid += i.converted_amount;
    if (i.kind === 'expected') expected += i.converted_amount;
  }
  return { paid: round2(paid), expected: round2(expected) };
}

/** Найближчий очікуваний платіж серед усіх підписок (включно з простроченими). */
export function nextPayment(userId: number, currency: Currency): CalendarItem | null {
  let best: CalendarItem | null = null;
  for (const s of listSubscriptions(userId)) {
    if (!isBillable(s) || !s.next_payment_date) continue;
    const [first] = expectedForSubscription(s, '0000-01-01', s.next_payment_date, currency);
    if (first && (!best || first.date < best.date)) best = first;
  }
  return best;
}
