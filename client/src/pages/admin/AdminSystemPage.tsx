import { useCallback } from 'react';
import * as api from '@/api/endpoints';
import { AdminSections } from '@/components/admin/AdminSections';
import { useRatesRefresh } from '@/components/admin/OverviewWidgets';
import { PageState } from '@/components/common/PageState';
import { ServiceCell } from '@/components/common/ServiceCell';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, RefreshIcon } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { daysWord, formatDate, formatDateTime, formatRate } from '@/lib/format';
import type { AdminSystem } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';

function RatesCard({ rates, onUpdated }: { rates: AdminSystem['rates']; onUpdated: () => void }) {
  const { refresh, busy, result } = useRatesRefresh(onUpdated);
  return (
    <Card as="section" aria-label="Курси НБУ" className={ui.layout.cardStack}>
      <div className={ui.layout.cardHeader}>
        <div className={ui.section.titles}>
          <h2 className={ui.layout.cardTitle}>Курси НБУ</h2>
          <p className={ui.section.subtitle}>Оновлюються при старті сервера й щодня о 00:05 за Києвом</p>
        </div>
        <Button variant="secondary" onClick={refresh} loading={busy}>
          <RefreshIcon size={20} />
          Оновити зараз
        </Button>
      </div>
      {result && <Alert variant={result.ok ? 'success' : 'error'}>{result.message}</Alert>}
      {rates.length === 0 ? (
        <EmptyState title="Курсів ще немає" description="Натисніть «Оновити зараз», щоб завантажити курс НБУ." />
      ) : (
        <div className={ui.admin.rates}>
          {rates.map((r) => (
            <div key={r.currency} className={ui.admin.rateBox}>
              <span className={ui.admin.rateCode}>1 {r.currency}</span>
              <span className={ui.admin.rateValue}>{formatRate(r.rate)}</span>
              <span className={ui.admin.rateMeta}>
                Курс на {formatDate(r.rate_date)} · отримано {formatDateTime(r.fetched_at)}
              </span>
              <span>
                <Badge variant={r.source === 'nbu' ? 'success' : 'warning'} dot>
                  {r.source === 'nbu' ? 'НБУ' : 'Резервний (НБУ був недоступний)'}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RemindersCard({ data }: { data: AdminSystem }) {
  return (
    <Card as="section" variant="base" aria-label="Надіслані нагадування" className={ui.admin.flushCard}>
      <div className={cn(ui.admin.flushTitle, ui.layout.cardHeader)}>
        <span>Останні нагадування</span>
        <Badge variant="accent">сьогодні надіслано {data.reminders_today}</Badge>
      </div>
      {data.reminders.length === 0 ? (
        <EmptyState
          title="Нагадувань ще не надсилали"
          description="Бот перевіряє підписки щогодини й надсилає нагадування за 7, 3 і 1 день до платежу."
        />
      ) : (
        <div className={ui.table.wrapper}>
          <table className={cn(ui.table.table, ui.admin.table)}>
            <caption className={ui.srOnly}>Останні 20 надісланих нагадувань</caption>
            <thead className={ui.table.head}>
              <tr>
                {['Надіслано', 'Користувач', 'Сервіс', 'Платіж', 'За скільки'].map((h) => (
                  <th key={h} scope="col" className={ui.table.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.reminders.map((r) => (
                <tr key={r.id} className={ui.table.row}>
                  <td className={ui.table.tdMuted}>{formatDateTime(r.sent_at)}</td>
                  <td className={ui.table.td}>{r.nickname}</td>
                  <td className={ui.table.td}>
                    <ServiceCell name={r.service_name} icon={r.icon} brandColor={r.brand_color} size="sm" />
                  </td>
                  <td className={ui.table.td}>{formatDate(r.due_date)}</td>
                  <td className={ui.table.tdMuted}>
                    {r.days_before} {daysWord(r.days_before)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function AdminSystemPage() {
  const system = useAsync((signal) => api.admin.system(signal), []);
  const { reload } = system;
  const onUpdated = useCallback(() => reload(), [reload]);

  return (
    <div className={ui.layout.stack}>
      <PageHeader title="Адмін-панель" subtitle="Курси валют і нагадування Telegram-бота" />
      <AdminSections />
      <PageState {...system} onRetry={reload} loadingLabel="Завантаження">
        {(d) => (
          <>
            <RatesCard rates={d.rates} onUpdated={onUpdated} />
            <RemindersCard data={d} />
          </>
        )}
      </PageState>
    </div>
  );
}
