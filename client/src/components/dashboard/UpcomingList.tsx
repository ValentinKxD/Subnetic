import { Link } from 'react-router-dom';
import { EmptyState, ServiceIcon } from '@/components/ui';
import { billingPeriodLabels, formatDayShort, formatMoney, formatRelativeDays } from '@/lib/format';
import type { Subscription } from '@/lib/types';
import { ui } from '@/lib/ui';

/** Короткий список найближчих підписок на дашборді. */
export function UpcomingList({ items }: { items: Subscription[] }) {
  return (
    <div className={ui.layout.cardStack}>
      <div className={ui.layout.cardHeader}>
        <h2 className={ui.layout.cardTitle}>Найближчі підписки</h2>
        <Link to="/subscriptions" className={ui.link.small}>
          Усі підписки
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Немає активних підписок" description="Додайте першу підписку, щоб бачити найближчі списання." />
      ) : (
        <ul className={ui.list.plain}>
          {items.map((s) => (
            <li key={s.id} className={ui.list.row}>
              <ServiceIcon name={s.service.name} icon={s.service.icon} brandColor={s.service.brand_color} />
              <div className={ui.list.main}>
                <span className={ui.list.title}>{s.service.name}</span>
                <span className={ui.list.meta}>
                  {s.plan.name} · {billingPeriodLabels[s.plan.billing_period]}
                  {s.next_payment_date && ` · ${formatDayShort(s.next_payment_date)}`}
                </span>
              </div>
              <div className={ui.list.end}>
                <span className={ui.list.amount}>{formatMoney(s.converted_price, s.display_currency)}</span>
                {s.next_payment_date && <span className={ui.money.sub}>{formatRelativeDays(s.next_payment_date)}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
