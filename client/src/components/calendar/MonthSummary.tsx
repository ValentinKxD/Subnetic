import { formatMoney } from '@/lib/format';
import type { Currency } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface MonthSummaryProps {
  paid: number;
  expected: number;
  currency: Currency;
}

/** Підсумок місяця: сплачено / очікується (у валюті користувача). */
export function MonthSummary({ paid, expected, currency }: MonthSummaryProps) {
  return (
    <dl className={ui.summary.grid} aria-label="Підсумок місяця">
      <div className={ui.summary.box}>
        <dt className={ui.summary.label}>Сплачено</dt>
        <dd className={ui.summary.value}>{formatMoney(paid, currency)}</dd>
      </div>
      <div className={ui.summary.box}>
        <dt className={ui.summary.label}>Очікується</dt>
        <dd className={ui.summary.value}>{formatMoney(expected, currency)}</dd>
      </div>
    </dl>
  );
}
