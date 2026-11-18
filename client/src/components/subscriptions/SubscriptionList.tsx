import { Amount } from '@/components/common/Amount';
import { ServiceCell } from '@/components/common/ServiceCell';
import { billingPeriodLabels, formatDate, formatMoney } from '@/lib/format';
import type { Subscription } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';
import { StatusBadge } from './StatusBadge';
import { SubscriptionActions, type SubscriptionActionHandlers } from './SubscriptionActions';

export interface SubscriptionListProps extends SubscriptionActionHandlers {
  items: Subscription[];
}

function nextPaymentText(s: Subscription): string {
  if (!s.next_payment_date) return '—';
  const date = formatDate(s.next_payment_date);
  return s.status === 'trial' ? `${date} (кінець пробного)` : date;
}

/** Таблиця на десктопі. */
function SubscriptionTable({ items, ...handlers }: SubscriptionListProps) {
  return (
    <div className={ui.table.wrapper}>
      <table className={cn(ui.table.table, ui.table.wide)}>
        <caption className={ui.srOnly}>Список підписок</caption>
        <thead className={ui.table.head}>
          <tr>
            <th scope="col" className={ui.table.th}>
              Сервіс
            </th>
            <th scope="col" className={ui.table.th}>
              Тариф
            </th>
            <th scope="col" className={ui.table.th}>
              Ціна
            </th>
            <th scope="col" className={ui.table.th}>
              Наступний платіж
            </th>
            <th scope="col" className={ui.table.th}>
              Статус
            </th>
            <th scope="col" className={ui.table.th}>
              Оплата
            </th>
            <th scope="col" className={ui.table.th}>
              <span className={ui.srOnly}>Дії</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className={ui.table.row}>
              <td className={ui.table.td}>
                <ServiceCell name={s.service.name} icon={s.service.icon} brandColor={s.service.brand_color} meta={s.service.category} />
              </td>
              <td className={ui.table.td}>
                {s.plan.name} · {billingPeriodLabels[s.plan.billing_period]}
              </td>
              <td className={ui.table.td}>
                <Amount amount={s.plan.price} currency={s.plan.currency} converted={s.converted_price} displayCurrency={s.display_currency} />
              </td>
              <td className={ui.table.td}>{nextPaymentText(s)}</td>
              <td className={ui.table.td}>
                <StatusBadge status={s.status} />
              </td>
              <td className={ui.table.tdMuted}>{s.payment_method ?? '—'}</td>
              <td className={ui.table.tdActions}>
                <SubscriptionActions subscription={s} {...handlers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Картки на мобільних. */
function SubscriptionCards({ items, ...handlers }: SubscriptionListProps) {
  return (
    <ul className={ui.itemCard.list}>
      {items.map((s) => (
        <li key={s.id} className={ui.itemCard.card}>
          <div className={ui.itemCard.top}>
            <div className={ui.list.main}>
              <ServiceCell
                name={s.service.name}
                icon={s.service.icon}
                brandColor={s.service.brand_color}
                meta={`${s.plan.name} · ${billingPeriodLabels[s.plan.billing_period]}`}
              />
            </div>
            <SubscriptionActions subscription={s} {...handlers} />
          </div>
          <dl className={ui.itemCard.grid}>
            <div>
              <dt className={ui.itemCard.label}>Ціна</dt>
              <dd className={ui.itemCard.value}>
                {formatMoney(s.plan.price, s.plan.currency)}
                {s.plan.currency !== s.display_currency && ` ≈ ${formatMoney(s.converted_price, s.display_currency)}`}
              </dd>
            </div>
            <div>
              <dt className={ui.itemCard.label}>Наступний платіж</dt>
              <dd className={ui.itemCard.value}>{nextPaymentText(s)}</dd>
            </div>
            <div>
              <dt className={ui.itemCard.label}>Статус</dt>
              <dd>
                <StatusBadge status={s.status} />
              </dd>
            </div>
            <div>
              <dt className={ui.itemCard.label}>Оплата</dt>
              <dd className={ui.itemCard.value}>{s.payment_method ?? '—'}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}

export function SubscriptionList(props: SubscriptionListProps) {
  return (
    <section aria-label="Список підписок">
      <div className={ui.responsive.desktopOnly}>
        <SubscriptionTable {...props} />
      </div>
      <div className={ui.responsive.mobileOnly}>
        <SubscriptionCards {...props} />
      </div>
    </section>
  );
}
