import { daysBetween, todayISO } from '@shared/dates';
import type { BillingPeriod, Currency, PaymentMethodType, PaymentStatus, SubscriptionStatus } from '@/lib/types';

export const billingPeriodLabels: Record<BillingPeriod, string> = {
  week: 'тиждень',
  month: 'місяць',
  quarter: 'квартал',
  year: 'рік',
};

/** «Щомісяця», «Щороку» — для підписів біля суми. */
export const billingPeriodAdverbs: Record<BillingPeriod, string> = {
  week: 'Щотижня',
  month: 'Щомісяця',
  quarter: 'Щокварталу',
  year: 'Щороку',
};

export const statusLabels: Record<SubscriptionStatus, string> = {
  trial: 'Пробна',
  active: 'Активна',
  paused: 'Пауза',
  cancelled: 'Скасована',
  expired: 'Завершена',
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: 'Сплачено',
  failed: 'Помилка',
  refunded: 'Повернено',
};

export const currencyLabels: Record<Currency, string> = {
  UAH: 'UAH — гривня',
  USD: 'USD — долар США',
  EUR: 'EUR — євро',
};

export const paymentMethodTypeLabels: Record<PaymentMethodType, string> = {
  card: 'Картка',
  paypal: 'PayPal',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  other: 'Інше',
};

const moneyFormatters = new Map<Currency, Intl.NumberFormat>();

/** 299 ₴, 11,99 $, 4,5 € — без зайвих нулів. */
export function formatMoney(amount: number, currency: Currency): string {
  let f = moneyFormatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    moneyFormatters.set(currency, f);
  }
  return f.format(amount);
}

/** Ціле значення для великих сум у плитках: 20 680 ₴. */
export function formatMoneyRounded(amount: number, currency: Currency): string {
  return formatMoney(Math.round(amount), currency);
}

function toDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

/** 21 лис 2026 */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(toDate(iso))
    .replace(' р.', '')
    .replace('.', '');
}

/** 21 листопада */
export function formatDayMonth(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long' }).format(toDate(iso));
}

/** 21 лис */
export function formatDayShort(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'short' }).format(toDate(iso)).replace('.', '');
}

/** субота */
export function formatWeekday(iso: string): string {
  return new Intl.DateTimeFormat('uk-UA', { weekday: 'long' }).format(toDate(iso));
}

/** Листопад 2026 */
export function formatMonthYear(month: string): string {
  const s = new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' }).format(toDate(`${month}-01`));
  const clean = s.replace(' р.', '');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/** Лис */
export function formatMonthShort(month: string): string {
  const s = new Intl.DateTimeFormat('uk-UA', { month: 'short' }).format(toDate(`${month}-01`)).replace('.', '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const plural = new Intl.PluralRules('uk-UA');
function pluralize(n: number, forms: { one: string; few: string; many: string }): string {
  const rule = plural.select(n);
  return rule === 'one' ? forms.one : rule === 'few' ? forms.few : forms.many;
}

export function daysWord(n: number): string {
  return pluralize(Math.abs(n), { one: 'день', few: 'дні', many: 'днів' });
}

export function subscriptionsWord(n: number): string {
  return pluralize(n, { one: 'підписка', few: 'підписки', many: 'підписок' });
}

/** «Сьогодні», «Завтра», «Через 3 дні», «Прострочено на 2 дні». */
export function formatRelativeDays(iso: string, from: string = todayISO()): string {
  const d = daysBetween(from, iso);
  if (d === 0) return 'Сьогодні';
  if (d === 1) return 'Завтра';
  if (d === -1) return 'Учора';
  if (d > 0) return `Через ${d} ${daysWord(d)}`;
  return `${Math.abs(d)} ${daysWord(d)} тому`;
}

export function initials(nickname: string): string {
  return nickname.trim().slice(0, 2).toUpperCase();
}
