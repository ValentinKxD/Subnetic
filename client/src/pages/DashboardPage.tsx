import { Link } from 'react-router-dom';
import { PageState } from '@/components/common/PageState';
import { NextPayment } from '@/components/dashboard/NextPayment';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { StatCard } from '@/components/dashboard/StatCard';
import { UpcomingList } from '@/components/dashboard/UpcomingList';
import { Card, CardIcon, PageHeader, PlusIcon, RepeatIcon, TrendingIcon } from '@/components/ui';
import { useDashboard } from '@/hooks/useDashboard';
import { formatMoney, formatMoneyRounded, formatMonthYear } from '@/lib/format';
import type { Dashboard } from '@/lib/types';
import { ui } from '@/lib/ui';

function statHints(d: Dashboard) {
  const parts = [];
  if (d.paused_count) parts.push(`${d.paused_count} на паузі`);
  if (d.trial_count) parts.push(`${d.trial_count} пробн${d.trial_count === 1 ? 'а' : 'і'}`);
  return parts.join(' · ') || 'Без пауз і пробних';
}

export function DashboardPage() {
  const { data, loading, error, reload } = useDashboard();

  return (
    <div className={ui.layout.stack}>
      <PageHeader
        title="Дашборд"
        subtitle={data ? formatMonthYear(data.month) : undefined}
        actions={
          <Link to="/subscriptions?new=1" className={ui.btn.primary}>
            <PlusIcon />
            Додати підписку
          </Link>
        }
      />
      <PageState data={data} loading={loading} error={error} onRetry={reload} loadingLabel="Завантаження дашборда">
        {(d) => (
          <>
            <NextPayment payment={d.next_payment} currency={d.currency} />
            <section aria-label="Ключові показники" className={ui.layout.grid3}>
              <StatCard
                icon={<RepeatIcon size={22} />}
                label="Активні підписки"
                value={String(d.active_count + d.trial_count)}
                hint={statHints(d)}
              />
              <StatCard
                icon={<CardIcon size={22} />}
                label="Витрати за місяць"
                value={formatMoneyRounded(d.monthly_total, d.currency)}
                hint={`Цього місяця сплачено ${formatMoney(d.month_paid, d.currency)} · очікується ${formatMoney(d.month_expected, d.currency)}`}
              />
              <StatCard
                icon={<TrendingIcon size={22} />}
                label="Річний прогноз"
                value={formatMoneyRounded(d.yearly_forecast, d.currency)}
                hint={`≈ ${formatMoneyRounded(d.monthly_total, d.currency)} на місяць × 12`}
              />
            </section>
            <section aria-label="Витрати і найближчі підписки" className={ui.layout.mainAside}>
              <Card>
                <SpendingChart data={d.chart} currency={d.currency} />
              </Card>
              <Card>
                <UpcomingList items={d.upcoming} />
              </Card>
            </section>
          </>
        )}
      </PageState>
    </div>
  );
}
