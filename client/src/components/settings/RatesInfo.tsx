import { Badge } from '@/components/ui';
import { formatDate, formatDateTime, formatRate } from '@/lib/format';
import type { Rates } from '@/lib/types';
import { ui } from '@/lib/ui';

interface RatesInfoProps {
  rates: Rates | null;
  loading: boolean;
  error: boolean;
}

/** Поточні курси НБУ (USD, EUR → ₴), дата курсу і час оновлення. */
export function RatesInfo({ rates, loading, error }: RatesInfoProps) {
  if (loading && !rates) {
    return (
      <div className={ui.rates.box} aria-busy="true">
        <p className={ui.rates.meta}>Завантажуємо курси валют…</p>
      </div>
    );
  }

  if (error || !rates) {
    return (
      <div className={ui.rates.box}>
        <p className={ui.rates.meta}>
          Не вдалося отримати курси. Суми все одно перераховуються за останнім збереженим курсом.
        </p>
      </div>
    );
  }

  const fromNbu = rates.source === 'nbu';

  return (
    <section className={ui.rates.box} aria-label="Курси валют">
      <div className={ui.rates.header}>
        <h3 className={ui.rates.title}>
          {fromNbu && rates.rate_date ? `Курс НБУ на ${formatDate(rates.rate_date)}` : 'Резервний курс'}
        </h3>
        {fromNbu ? (
          <Badge variant="success" dot>
            НБУ
          </Badge>
        ) : (
          <Badge variant="warning" dot>
            НБУ недоступний
          </Badge>
        )}
      </div>

      <dl className={ui.rates.grid}>
        <div className={ui.rates.pair}>
          <dt className={ui.rates.code}>1 USD</dt>
          <dd className={ui.rates.value}>{formatRate(rates.rates.USD)}</dd>
        </div>
        <div className={ui.rates.pair}>
          <dt className={ui.rates.code}>1 EUR</dt>
          <dd className={ui.rates.value}>{formatRate(rates.rates.EUR)}</dd>
        </div>
      </dl>

      <p className={ui.rates.meta}>
        {fromNbu
          ? `Оновлено ${formatDateTime(rates.updated_at)}. Курс оновлюється щодня; ціни в інших валютах перераховуються автоматично.`
          : 'Курс НБУ ще не вдалося завантажити — використовуються збережені значення. Сервер повторить спробу автоматично.'}
      </p>
    </section>
  );
}
