import { DEFAULT_RATES } from '../../../shared/money.js';
import type { Currency, Rates } from '../types.js';
import { isoDateTime, sql, transaction } from './index.js';

/** Доступ до exchange_rates (курси до гривні). */

export type RateSource = 'nbu' | 'seed';

export interface CurrentRates {
  rates: Rates;
  /** Дата, на яку встановлено курс (за НБУ). */
  rate_date: string | null;
  /** Коли сервер востаннє отримав курс (ISO 8601). */
  updated_at: string | null;
  /** 'nbu' — курс НБУ; 'seed' — резервний (НБУ ще жодного разу не був доступний). */
  source: RateSource;
}

interface Row {
  currency: Currency;
  rate_to_uah: number;
  rate_date: string;
  source: RateSource;
  fetched_at: string;
}

/** Актуальні курси (v_current_rates): НБУ має перевагу над резервними, далі — найсвіжіші. */
export function getCurrentRates(): CurrentRates {
  const rows = sql(`SELECT currency, rate_to_uah, rate_date, source, fetched_at FROM v_current_rates`).all() as Row[];
  // Якщо в таблиці ще нічого немає (БД без seed і без мережі) — резервні значення з коду.
  const rates: Rates = { ...DEFAULT_RATES };
  let main: Row | undefined;
  for (const r of rows) {
    if (r.currency === 'UAH') continue;
    rates[r.currency] = r.rate_to_uah;
    // Дату й джерело показуємо за доларом (USD і EUR НБУ встановлює разом).
    if (!main || r.currency === 'USD') main = r;
  }
  return {
    rates,
    rate_date: main?.rate_date ?? null,
    updated_at: main ? isoDateTime(main.fetched_at) : null,
    source: main?.source ?? 'seed',
  };
}

/** Зберігає курси НБУ на дату rate_date */
export function saveNbuRates(rateDate: string, rates: Pick<Rates, 'USD' | 'EUR'>): void {
  const upsert = sql(
    `INSERT INTO exchange_rates (currency, rate_to_uah, rate_date, source, fetched_at)
     VALUES (@currency, @rate, @rate_date, 'nbu', datetime('now'))
     ON CONFLICT (currency, rate_date) DO UPDATE SET
       rate_to_uah = excluded.rate_to_uah,
       source      = 'nbu',
       fetched_at  = excluded.fetched_at`,
  );
  transaction(() => {
    upsert.run({ currency: 'UAH', rate: 1, rate_date: rateDate });
    upsert.run({ currency: 'USD', rate: rates.USD, rate_date: rateDate });
    upsert.run({ currency: 'EUR', rate: rates.EUR, rate_date: rateDate });
  });
}
