import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { monthOf, todayISO } from '@shared/dates';
import { MonthSummary } from '@/components/calendar/MonthSummary';
import { PaymentCalendar } from '@/components/calendar/PaymentCalendar';
import { PaymentHistory } from '@/components/calendar/PaymentHistory';
import { PaymentList } from '@/components/calendar/PaymentList';
import { Card, ErrorState, PageHeader, PlusIcon, Spinner } from '@/components/ui';
import { useCalendar, useMarkPaid } from '@/hooks/usePayments';
import { formatMoney, formatMonthYear } from '@/lib/format';
import { ui } from '@/lib/ui';

export function CalendarPage() {
  const today = todayISO();
  const [month, setMonth] = useState(monthOf(today));
  const [selected, setSelected] = useState(today);
  const [historyKey, setHistoryKey] = useState(0);
  const calendar = useCalendar(month);
  const data = calendar.data;

  const changeMonth = useCallback(
    (m: string) => {
      setMonth(m);
      // Обраний день — сьогодні, якщо він у цьому місяці, інакше 1-ше число.
      setSelected(monthOf(today) === m ? today : `${m}-01`);
    },
    [today],
  );

  const afterPay = useCallback(() => {
    calendar.reload();
    setHistoryKey((k) => k + 1);
  }, [calendar]);
  const markPaid = useMarkPaid(afterPay);

  const dayItems = useMemo(() => data?.items.filter((i) => i.date === selected) ?? [], [data, selected]);

  const subtitle = data
    ? `${formatMonthYear(month)} · сплачено ${formatMoney(data.summary.paid, data.currency)} · очікується ${formatMoney(data.summary.expected, data.currency)}`
    : formatMonthYear(month);

  return (
    <div className={ui.layout.stack}>
      <PageHeader
        title="Календар і платежі"
        subtitle={subtitle}
        actions={
          <Link to="/subscriptions?new=1" className={ui.btn.primary}>
            <PlusIcon />
            Додати підписку
          </Link>
        }
      />

      <section className={ui.layout.mainAsideWide} aria-label="Календар платежів">
        <Card>
          {calendar.error && !data ? (
            <ErrorState message={calendar.error} onRetry={calendar.reload} />
          ) : (
            <div aria-busy={calendar.loading || calendar.refreshing}>
              <PaymentCalendar
                month={month}
                onMonthChange={changeMonth}
                items={data?.items ?? []}
                selected={selected}
                onSelect={setSelected}
              />
            </div>
          )}
        </Card>
        <Card as="aside" aria-label="Платежі за вибраний день" className={ui.layout.cardStack}>
          {calendar.loading ? (
            <div className={ui.layout.loadingInline}>
              <Spinner size="lg" label="Завантаження платежів" />
            </div>
          ) : data ? (
            <>
              <MonthSummary paid={data.summary.paid} expected={data.summary.expected} currency={data.currency} />
              <PaymentList date={selected} items={dayItems} currency={data.currency} onMarkPaid={markPaid} />
            </>
          ) : null}
        </Card>
      </section>

      <Card as="section" aria-label="Історія платежів">
        <PaymentHistory refreshKey={historyKey} />
      </Card>
    </div>
  );
}
