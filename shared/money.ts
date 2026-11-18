/**
 * Правила сум (спільні для клієнта і сервера):
 * - нормалізація до місяця: week × 52 / 12, month × 1, quarter ÷ 3, year ÷ 12;
 * - річний прогноз = місячна сума × 12;
 * - конвертація у валюту користувача за фіксованими курсами (заглушка замість НБУ).
 */

export const CURRENCIES = ['UAH', 'USD', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const BILLING_PERIODS = ['week', 'month', 'quarter', 'year'] as const;
export type BillingPeriod = (typeof BILLING_PERIODS)[number];

/** Скільки гривень коштує 1 одиниця валюти. */
export type Rates = Record<Currency, number>;

/** Фіксовані курси заглушки (USD/EUR → UAH). */
export const DEFAULT_RATES: Rates = { UAH: 1, USD: 41.5, EUR: 45.2 };

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function convert(amount: number, from: Currency, to: Currency, rates: Rates = DEFAULT_RATES): number {
  if (from === to) return amount;
  return (amount * rates[from]) / rates[to];
}

/** Ціна за період → еквівалент на місяць. */
export function toMonthly(price: number, period: BillingPeriod): number {
  switch (period) {
    case 'week':
      return (price * 52) / 12;
    case 'month':
      return price;
    case 'quarter':
      return price / 3;
    case 'year':
      return price / 12;
  }
}

export function toYearly(monthly: number): number {
  return monthly * 12;
}
