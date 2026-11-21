import { useCallback } from 'react';
import * as api from '@/api/endpoints';
import { AdminLogList } from '@/components/admin/AdminLogList';
import { AdminSections } from '@/components/admin/AdminSections';
import { BackgroundJobs, RegistrationsChart, TopServices } from '@/components/admin/OverviewWidgets';
import { PageState } from '@/components/common/PageState';
import { StatCard } from '@/components/dashboard/StatCard';
import { BoxIcon, Button, PageHeader, RefreshIcon, RepeatIcon, SendIcon, UsersIcon } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { formatDateTime } from '@/lib/format';
import { ui } from '@/lib/ui';

const nf = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 });

export function AdminOverviewPage() {
  const stats = useAsync((signal) => api.admin.stats(signal), []);
  const { reload } = stats;
  const onRatesUpdated = useCallback(() => reload(), [reload]);

  return (
    <div className={ui.layout.stack}>
      <PageHeader
        title="Адмін-панель"
        subtitle={stats.data ? `Стан системи на ${formatDateTime(new Date().toISOString())}` : undefined}
        actions={
          <Button variant="secondary" onClick={reload} loading={stats.refreshing}>
            <RefreshIcon size={20} />
            Оновити
          </Button>
        }
      />
      <AdminSections />
      <PageState {...stats} onRetry={reload} loadingLabel="Завантаження статистики">
        {(d) => (
          <>
            <section aria-label="Ключові показники" className={ui.admin.stats}>
              <StatCard
                icon={<UsersIcon size={22} />}
                label="Користувачі"
                value={String(d.users.total)}
                hint={`+${d.users.new_30d} за 30 днів · адмінів ${d.users.admins} · заблоковано ${d.users.blocked}`}
              />
              <StatCard
                icon={<RepeatIcon size={22} />}
                label="Активні підписки"
                value={String(d.subscriptions.active)}
                hint={`${nf.format(d.subscriptions.per_user)} на користувача`}
              />
              <StatCard
                icon={<SendIcon size={22} />}
                label="Прив’язали Telegram"
                value={String(d.users.telegram_linked)}
                hint={
                  d.users.total > 0
                    ? `${Math.round((d.users.telegram_linked / d.users.total) * 100)} % користувачів`
                    : 'Користувачів ще немає'
                }
              />
              <StatCard
                icon={<BoxIcon size={22} />}
                label="Каталог"
                value={`${d.catalog.services} / ${d.catalog.plans}`}
                hint={`сервісів / тарифів · ${d.catalog.categories} категорій · власних ${d.catalog.custom_services}`}
              />
            </section>
            <div className={ui.admin.twoCol}>
              <RegistrationsChart days={d.registrations} />
              <TopServices items={d.top_services} />
            </div>
            <div className={ui.admin.twoCol}>
              <BackgroundJobs stats={d} onRatesUpdated={onRatesUpdated} />
              <AdminLogList items={d.log} />
            </div>
          </>
        )}
      </PageState>
    </div>
  );
}
