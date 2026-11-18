import { formatMoney } from '@/lib/format';
import type { Currency } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface AmountProps {
  /** Сума в оригінальній валюті тарифу. */
  amount: number;
  currency: Currency;
  /** Та сама сума у валюті користувача; показується «≈ …», якщо валюти різні. */
  converted: number;
  displayCurrency: Currency;
}

/** Ціна в валюті тарифу + перерахунок у валюту користувача. */
export function Amount({ amount, currency, converted, displayCurrency }: AmountProps) {
  return (
    <span className="flex flex-col">
      <span className={ui.money.main}>{formatMoney(amount, currency)}</span>
      {currency !== displayCurrency && <span className={ui.money.sub}>≈ {formatMoney(converted, displayCurrency)}</span>}
    </span>
  );
}
