import { useState } from 'react';
import { ServiceCell } from '@/components/common/ServiceCell';
import { Button, EmptyState, ErrorState, Field, SearchIcon, Select, Spinner } from '@/components/ui';
import { useDebounced } from '@/hooks/useDebounced';
import { DEFAULT_HISTORY_FILTERS, usePaymentHistory, type PaymentHistoryFilters } from '@/hooks/usePayments';
import { billingPeriodLabels, formatDate, formatMoney, paymentStatusLabels } from '@/lib/format';
import type { PaymentStatus } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';
import { PaymentStatusBadge } from './PaymentStatusBadge';

const STATUS_OPTIONS = [
  { value: '', label: 'Усі статуси' },
  ...(Object.keys(paymentStatusLabels) as PaymentStatus[]).map((s) => ({ value: s, label: paymentStatusLabels[s] })),
];

/** Історія здійснених платежів з фільтрами (пошук, статус, період). */
export function PaymentHistory({ refreshKey }: { refreshKey: number }) {
  const [filters, setFilters] = useState<PaymentHistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const q = useDebounced(filters.q);
  const history = usePaymentHistory({ ...filters, q, refreshKey });
  const set = <K extends keyof PaymentHistoryFilters>(k: K, v: PaymentHistoryFilters[K]) => setFilters({ ...filters, [k]: v });
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_HISTORY_FILTERS);
  const data = history.data;

  return (
    <div className={ui.layout.cardStack}>
      <div className={ui.layout.cardHeader}>
        <h2 className={ui.layout.cardTitle}>Історія платежів</h2>
        {data && (
          <span className={ui.section.subtitle}>
            Сплачено за вибраний період: <strong>{formatMoney(data.total, data.currency)}</strong>
          </span>
        )}
      </div>

      <div className={ui.layout.toolbar}>
        <Field
          label="Пошук"
          type="search"
          placeholder="Сервіс або тариф"
          leadingIcon={<SearchIcon size={20} />}
          value={filters.q}
          onValueChange={(v) => set('q', v)}
          wrapperClassName={ui.filters.search}
        />
        <Field label="Статус" wrapperClassName={ui.filters.narrow}>
          {(c) => (
            <Select {...c} value={filters.status} options={STATUS_OPTIONS} onValueChange={(v) => set('status', v as PaymentStatus | '')} />
          )}
        </Field>
        <Field label="З дати" type="date" value={filters.from} onValueChange={(v) => set('from', v)} wrapperClassName={ui.filters.narrow} />
        <Field label="По дату" type="date" value={filters.to} onValueChange={(v) => set('to', v)} wrapperClassName={ui.filters.narrow} />
        <Button variant="secondary" onClick={() => setFilters(DEFAULT_HISTORY_FILTERS)} disabled={isDefault}>
          Скинути
        </Button>
      </div>

      {history.loading ? (
        <div className={ui.layout.loadingInline}>
          <Spinner size="lg" label="Завантаження історії" />
        </div>
      ) : history.error && !data ? (
        <ErrorState message={history.error} onRetry={history.reload} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={isDefault ? 'Платежів ще немає' : 'Нічого не знайдено'}
          description={isDefault ? 'Сплачені платежі з’являться тут.' : 'Змініть пошук або фільтри.'}
        />
      ) : data ? (
        <div className={ui.table.wrapper} aria-busy={history.refreshing}>
          <table className={cn(ui.table.table, ui.table.wide)}>
            <caption className={ui.srOnly}>Історія платежів</caption>
            <thead className={ui.table.head}>
              <tr>
                <th scope="col" className={ui.table.th}>
                  Дата
                </th>
                <th scope="col" className={ui.table.th}>
                  Сервіс
                </th>
                <th scope="col" className={ui.table.th}>
                  Сума
                </th>
                <th scope="col" className={ui.table.th}>
                  Оплата
                </th>
                <th scope="col" className={ui.table.th}>
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className={ui.table.row}>
                  <td className={ui.table.td}>{formatDate(p.date)}</td>
                  <td className={ui.table.td}>
                    <ServiceCell
                      name={p.service.name}
                      icon={p.service.icon}
                      brandColor={p.service.brand_color}
                      meta={`${p.plan_name} · ${billingPeriodLabels[p.billing_period]}`}
                      size="sm"
                    />
                  </td>
                  <td className={ui.table.td}>
                    <span className={ui.money.main}>{formatMoney(p.converted_amount, data.currency)}</span>
                    {p.currency !== data.currency && <span className={ui.money.subBlock}>{formatMoney(p.amount, p.currency)}</span>}
                  </td>
                  <td className={ui.table.tdMuted}>{p.payment_method ?? '—'}</td>
                  <td className={ui.table.td}>
                    <PaymentStatusBadge item={{ kind: 'paid', payment_status: p.status, overdue: false, trial_end: false, date: p.date }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
