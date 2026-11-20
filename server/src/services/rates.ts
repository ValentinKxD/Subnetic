import cron from 'node-cron';
import { z } from 'zod';
import { getCurrentRates, saveNbuRates } from '../db/rates.js';

/** Курси валют НБУ */

const NBU_URL = process.env.NBU_URL ?? 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json';
const TIMEOUT_MS = 10_000;
const RETRY_MS = 60 * 60 * 1000;
const DAILY_CRON = '5 0 * * *';
const TIMEZONE = 'Europe/Kyiv';

/** Один запис відповіді НБУ (беремо лише потрібні поля). */
const nbuItemSchema = z.object({
  cc: z.string(),
  rate: z.number().positive(),
  /** 'DD.MM.YYYY' */
  exchangedate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/),
});
const nbuResponseSchema = z.array(z.unknown());

/** 'DD.MM.YYYY' → 'YYYY-MM-DD'. */
function toISODate(nbuDate: string): string {
  const [d, m, y] = nbuDate.split('.');
  return `${y}-${m}-${d}`;
}

export interface NbuRates {
  rate_date: string;
  USD: number;
  EUR: number;
}

/** Завантажує й розбирає курси USD і EUR. Кидає помилку, якщо їх немає або формат інший. */
export async function fetchNbuRates(url = NBU_URL): Promise<NbuRates> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`НБУ відповів ${res.status}`);
  const list = nbuResponseSchema.parse(await res.json());

  const find = (cc: 'USD' | 'EUR') => {
    for (const raw of list) {
      const item = nbuItemSchema.safeParse(raw);
      if (item.success && item.data.cc === cc) return item.data;
    }
    throw new Error(`У відповіді НБУ немає курсу ${cc}`);
  };
  const usd = find('USD');
  const eur = find('EUR');
  return { rate_date: toISODate(usd.exchangedate), USD: usd.rate, EUR: eur.rate };
}

let retryTimer: NodeJS.Timeout | null = null;

/** Оновлює курси з НБУ. Ніколи не кидає: при збої лишає збережений курс і планує повтор. */
export async function refreshRates(): Promise<boolean> {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  try {
    const nbu = await fetchNbuRates();
    saveNbuRates(nbu.rate_date, nbu);
    console.log(`Курси НБУ на ${nbu.rate_date}: 1 USD = ${nbu.USD} ₴, 1 EUR = ${nbu.EUR} ₴`);
    return true;
  } catch (e) {
    const reason = e instanceof Error ? (e.cause instanceof Error ? `${e.message}: ${e.cause.message}` : e.message) : String(e);
    let fallback = 'збережених курсів немає';
    try {
      const current = getCurrentRates();
      const rates = `1 USD = ${current.rates.USD} ₴, 1 EUR = ${current.rates.EUR} ₴`;
      fallback = current.rate_date
        ? `використовується збережений курс (${current.source === 'nbu' ? 'НБУ' : 'резервний'}, ${current.rate_date}): ${rates}`
        : `збережених курсів немає, використовуються резервні: ${rates}`;
    } catch {
      // БД недоступна — лише логуємо.
    }
    console.warn(`Не вдалося оновити курси НБУ (${reason}); ${fallback}. Повтор через годину.`);
    retryTimer = setTimeout(() => void refreshRates(), RETRY_MS);
    retryTimer.unref();
    return false;
  }
}

/** Оновлення при старті (у фоні, не блокує запуск) і щодоби за розкладом. */
export function startRatesUpdater(): void {
  void refreshRates();
  cron.schedule(DAILY_CRON, () => void refreshRates(), { timezone: TIMEZONE, name: 'nbu-rates', noOverlap: true });
}
