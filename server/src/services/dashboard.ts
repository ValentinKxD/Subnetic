import { addMonthsToMonth, daysBetween, monthOf, monthRange, todayISO } from '../../../shared/dates.js';
import { convert, round2, toMonthly, toYearly } from '../../../shared/money.js';
import { listSubscriptionDetails } from '../db/subscriptions.js';
import type { CalendarItem, Currency, SubscriptionDTO, UserContext } from '../types.js';
import { nextPayment, scheduleBetween, summarize } from './schedule.js';
import { isBillable, toSubscriptionDTO } from './subscriptions.js';

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
  /** Лише один — найближчий — очікуваний платіж. */
  next_payment: (CalendarItem & { days_until: number }) | null;
  chart: Array<{ month: string; amount: number; kind: ChartKind }>;
  /** До 5 підписок за датою наступного списання (по одній даті на підписку). */
  upcoming: SubscriptionDTO[];
}

/** Скільки місяців до і після поточного показувати на графіку. */
const PAST_MONTHS = 9;
const FUTURE_MONTHS = 2;
const UPCOMING_LIMIT = 5;

export function buildDashboard(ctx: UserContext): DashboardDTO {
  const today = todayISO();
  const subs = listSubscriptionDetails(ctx.userId);
  const billable = subs.filter(isBillable);

  // Суму рахуємо без проміжного округлення кожної підписки — округлюємо лише підсумок.
  const monthly = billable.reduce(
    (sum, s) => sum + convert(toMonthly(s.plan.price, s.plan.billing_period), s.plan.currency, ctx.currency, ctx.rates),
    0,
  );

  const month = monthOf(today);
  const current = monthRange(month);
  const thisMonth = summarize(scheduleBetween(ctx, current.start, current.end, subs));

  const chart: DashboardDTO['chart'] = [];
  for (let i = -PAST_MONTHS; i <= FUTURE_MONTHS; i++) {
    const m = addMonthsToMonth(month, i);
    const { start, end } = monthRange(m);
    const s = summarize(scheduleBetween(ctx, start, end, subs));
    const kind: ChartKind = i < 0 ? 'actual' : i === 0 ? 'current' : 'forecast';
    const amount = kind === 'actual' ? s.paid : kind === 'forecast' ? s.expected : s.paid + s.expected;
    chart.push({ month: m, amount: round2(amount), kind });
  }

  const next = nextPayment(ctx, subs);

  const upcoming = billable
    .filter((s) => s.next_payment_date)
    .sort((a, b) => (a.next_payment_date ?? '').localeCompare(b.next_payment_date ?? ''))
    .slice(0, UPCOMING_LIMIT)
    .map((s) => toSubscriptionDTO(s, ctx));

  return {
    currency: ctx.currency,
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
