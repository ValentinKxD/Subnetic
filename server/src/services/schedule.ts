import { addPeriod, todayISO } from '../../../shared/dates.js';
import type { z } from 'zod';
import type { paymentHistoryQuerySchema } from '../../../shared/domain.js';
import { round2 } from '../../../shared/money.js';
import { listPayments } from '../db/payments.js';
import { listSubscriptionDetails } from '../db/subscriptions.js';
import type { CalendarItem, PaymentDetails, PaymentDTO, SubscriptionDetails, UserContext } from '../types.js';
import { toUserCurrency } from './context.js';
import { isBillable } from './subscriptions.js';

/** Графік платежів: майбутні дати обчислюються з next_payment_date */

/** Обчислені очікувані списання підписки в межах [from, to]. */
export function expectedForSubscription(
  sub: SubscriptionDetails,
  from: string,
  to: string,
  ctx: UserContext,
): CalendarItem[] {
  if (!isBillable(sub) || !sub.next_payment_date) return [];
  const today = todayISO();
  const items: CalendarItem[] = [];

  let d = sub.next_payment_date;
  let first = true;
  while (d <= to) {
    if (d >= from) {
      items.push({
        key: `s-${sub.id}-${d}`,
        kind: 'expected',
        date: d,
        subscription_id: sub.id,
        service: { name: sub.service.name, icon: sub.service.icon ?? '', brand_color: sub.service.brand_color },
        plan_name: sub.plan.name,
        billing_period: sub.plan.billing_period,
        amount: sub.plan.price,
        currency: sub.plan.currency,
        converted_amount: toUserCurrency(ctx, sub.plan.price, sub.plan.currency),
        payment_method: sub.payment_method_label,
        payment_status: null,
        overdue: d < today,
        trial_end: first && sub.status === 'trial',
        payable: first,
      });
    }
    // Без автопродовження списань після найближчого немає.
    if (!sub.auto_renew) break;
    d = addPeriod(d, sub.plan.billing_period);
    first = false;
  }
  return items;
}

function paymentService(p: PaymentDetails) {
  return { name: p.service_name, icon: p.service_icon ?? '', brand_color: p.brand_color };
}

export function paymentToItem(p: PaymentDetails, ctx: UserContext): CalendarItem {
  return {
    key: `p-${p.id}`,
    kind: 'paid',
    date: p.due_date,
    subscription_id: p.subscription_id,
    service: paymentService(p),
    plan_name: p.plan_name,
    billing_period: p.billing_period,
    amount: p.amount,
    currency: p.currency,
    converted_amount: toUserCurrency(ctx, p.amount, p.currency),
    payment_method: p.payment_method_label,
    payment_status: p.status,
    overdue: false,
    trial_end: false,
    payable: false,
  };
}

export function paymentToDTO(p: PaymentDetails, ctx: UserContext): PaymentDTO {
  return {
    id: p.id,
    subscription_id: p.subscription_id,
    date: p.due_date,
    paid_at: p.paid_at,
    status: p.status,
    amount: p.amount,
    currency: p.currency,
    converted_amount: toUserCurrency(ctx, p.amount, p.currency),
    service: paymentService(p),
    plan_name: p.plan_name,
    billing_period: p.billing_period,
    payment_method: p.payment_method_label,
  };
}

const byDateThenName = (a: CalendarItem, b: CalendarItem) =>
  a.date.localeCompare(b.date) || a.service.name.localeCompare(b.service.name, 'uk');

/** Платежі в діапазоні: минулі з БД + обчислені майбутні, відсортовані за датою */
export function scheduleBetween(
  ctx: UserContext,
  from: string,
  to: string,
  subs: SubscriptionDetails[] = listSubscriptionDetails(ctx.userId),
): CalendarItem[] {
  const past = listPayments(ctx.userId, { from, to }).map((p) => paymentToItem(p, ctx));
  const future = subs.flatMap((s) => expectedForSubscription(s, from, to, ctx));
  return [...past, ...future].sort(byDateThenName);
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

/** Лише найближчий очікуваний платіж серед усіх підписок (включно з простроченим). */
export function nextPayment(ctx: UserContext, subs: SubscriptionDetails[]): CalendarItem | null {
  let best: CalendarItem | null = null;
  for (const s of subs) {
    if (!isBillable(s) || !s.next_payment_date) continue;
    const [first] = expectedForSubscription(s, s.next_payment_date, s.next_payment_date, ctx);
    if (first && (!best || byDateThenName(first, best) < 0)) best = first;
  }
  return best;
}

/** Історія здійснених платежів з фільтрами і сумою успішних. */
export function paymentHistory(ctx: UserContext, query: z.output<typeof paymentHistoryQuerySchema>) {
  const q = query.q?.toLocaleLowerCase('uk');
  const items = listPayments(ctx.userId, {
    from: query.from,
    to: query.to,
    status: query.status,
    subscription_id: query.subscription_id,
  })
    .filter(
      (p) =>
        !q ||
        p.service_name.toLocaleLowerCase('uk').includes(q) ||
        p.plan_name.toLocaleLowerCase('uk').includes(q),
    )
    .map((p) => paymentToDTO(p, ctx));

  const total = round2(items.filter((p) => p.status === 'paid').reduce((s, p) => s + p.converted_amount, 0));
  return { items, total, currency: ctx.currency };
}
