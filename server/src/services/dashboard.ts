import { addMonthsToMonth, daysBetween, monthOf, monthRange, todayISO } from '../../../shared/dates.js';
import { round2, toYearly, type Currency } from '../../../shared/money.js';
import { listSubscriptions } from '../data/store.js';
import type { CalendarItem, SubscriptionDTO } from '../data/types.js';
import { nextPayment, scheduleBetween, summarize } from './schedule.js';
import { isBillable, monthlyAmount, planAndService, toSubscriptionDTO } from './subscriptions.js';

export type ChartKind = 'actual' | 'current' | 'forecast';

export interface DashboardDTO {
  currency: Currency;
  active_count: number;
  trial_count: number;
  paused_count: number;
  /** Нормалізовані до місяця витрати на активні (і пробні з автопродовженням) підписки. */
  monthly_total: number;
  /** monthly_total × 12. */
  yearly_forecast: number;
  month: string;
  month_paid: number;
  month_expected: number;
  next_payment: (CalendarItem & { days_until: number }) | null;
  chart: Array<{ month: string; amount: number; kind: ChartKind }>;
  upcoming: SubscriptionDTO[];
}

/** Скільки місяців до і після поточного показувати на графіку. */
const PAST_MONTHS = 9;
const FUTURE_MONTHS = 2;

export function buildDashboard(userId: number, currency: Currency): DashboardDTO {
  const today = todayISO();
  const subs = listSubscriptions(userId);

  let monthly = 0;
  for (const s of subs) {
    if (!isBillable(s)) continue;
    const ps = planAndService(s);
    if (ps) monthly += monthlyAmount(ps.plan, currency);
  }

  const month = monthOf(today);
  const thisMonth = summarize(scheduleBetween(userId, monthRange(month).start, monthRange(month).end, currency));

  const chart: DashboardDTO['chart'] = [];
  for (let i = -PAST_MONTHS; i <= FUTURE_MONTHS; i++) {
    const m = addMonthsToMonth(month, i);
    const { start, end } = monthRange(m);
    const s = summarize(scheduleBetween(userId, start, end, currency));
    const kind: ChartKind = i < 0 ? 'actual' : i === 0 ? 'current' : 'forecast';
    const amount = kind === 'actual' ? s.paid : kind === 'forecast' ? s.expected : s.paid + s.expected;
    chart.push({ month: m, amount: round2(amount), kind });
  }

  const next = nextPayment(userId, currency);

  const upcoming = subs
    .filter((s) => isBillable(s) && s.next_payment_date)
    .sort((a, b) => (a.next_payment_date ?? '').localeCompare(b.next_payment_date ?? ''))
    .slice(0, 5)
    .map((s) => toSubscriptionDTO(s, currency))
    .filter((s): s is SubscriptionDTO => s !== null);

  return {
    currency,
    active_count: subs.filter((s) => s.status === 'active').length,
    trial_count: subs.filter((s) => s.status === 'trial').length,
    paused_count: subs.filter((s) => s.status === 'paused').length,
    monthly_total: round2(monthly),
    yearly_forecast: round2(toYearly(monthly)),
    month,
    month_paid: thisMonth.paid,
    month_expected: thisMonth.expected,
    next_payment: next ? { ...next, days_until: daysBetween(today, next.date) } : null,
    chart,
    upcoming,
  };
}
