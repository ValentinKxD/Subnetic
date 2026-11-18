import { useState } from 'react';
import { ServiceCell } from '@/components/common/ServiceCell';
import { Alert, Button, CheckIcon, EmptyState } from '@/components/ui';
import { billingPeriodAdverbs, formatDayMonth, formatMoney, formatRelativeDays, formatWeekday } from '@/lib/format';
import type { CalendarItem, Currency } from '@/lib/types';
import { ui } from '@/lib/ui';
import { PaymentStatusBadge } from './PaymentStatusBadge';

export interface PaymentListProps {
  /** 'YYYY-MM-DD' */
  date: string;
  items: CalendarItem[];
  currency: Currency;
  onMarkPaid: (subscriptionId: number) => Promise<unknown>;
}

function PaymentItem({ item, currency, onMarkPaid }: { item: CalendarItem; currency: Currency; onMarkPaid: PaymentListProps['onMarkPaid'] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = [item.plan_name, billingPeriodAdverbs[item.billing_period].toLowerCase(), item.payment_method]
    .filter(Boolean)
    .join(' · ');

  async function pay() {
    if (item.subscription_id === null) return;
    setBusy(true);
    setError(null);
    try {
      await onMarkPaid(item.subscription_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не вдалося позначити платіж');
      setBusy(false);
    }
  }

  return (
    <li className={ui.inset.box}>
      <div className={ui.list.cell}>
        <div className={ui.list.main}>
          <ServiceCell name={item.service.name} icon={item.service.icon} brandColor={item.service.brand_color} meta={meta} />
        </div>
        <div className={ui.list.end}>
          <span className={ui.money.big}>{formatMoney(item.converted_amount, currency)}</span>
          {item.currency !== currency && <span className={ui.money.sub}>{formatMoney(item.amount, item.currency)}</span>}
        </div>
      </div>
      <PaymentStatusBadge item={item} />
      {item.payable && item.subscription_id !== null && (
        <Button onClick={pay} loading={busy} block>
          <CheckIcon />
          Позначити оплаченим
        </Button>
      )}
      {error && <Alert variant="error">{error}</Alert>}
    </li>
  );
}

/** Платежі обраної дати. */
export function PaymentList({ date, items, currency, onMarkPaid }: PaymentListProps) {
  return (
    <div className={ui.layout.cardStack}>
      <div className={ui.section.titles}>
        <h2 className={ui.layout.cardTitle}>{formatDayMonth(date)}</h2>
        <span className={ui.section.subtitle}>
          {formatWeekday(date)} · {formatRelativeDays(date).toLowerCase()}
        </span>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Платежів немає" description="У цей день немає ні сплачених, ні очікуваних списань." />
      ) : (
        <ul className={ui.itemCard.list} aria-label={`Платежі ${formatDayMonth(date)}`}>
          {items.map((i) => (
            <PaymentItem key={i.key} item={i} currency={currency} onMarkPaid={onMarkPaid} />
          ))}
        </ul>
      )}
    </div>
  );
}
