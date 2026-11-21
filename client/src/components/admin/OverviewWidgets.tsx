import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '@/api/endpoints';
import { Badge, Button, Card, EmptyState, ServiceIcon } from '@/components/ui';
import { formatBytes, formatDateTime, formatRate, formatWeekdayShort } from '@/lib/format';
import type { AdminRate, AdminStats } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';

/** Реєстрації за 7 днів: стовпчики, сьогоднішній — акцентний. */
export function RegistrationsChart({ days }: { days: AdminStats['registrations'] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  return (
    <Card as="section" aria-label="Нові користувачі за тиждень" className={ui.layout.cardStack}>
      <div className={ui.layout.cardHeader}>
        <h2 className={ui.layout.cardTitle}>Нові користувачі за тиждень</h2>
        <span className={ui.hint}>усього {total}</span>
      </div>
      <div className={ui.admin.bars}>
        {days.map((d, i) => (
          <div key={d.date} className={ui.admin.barCol}>
            <span className={ui.admin.barValue}>{d.count}</span>
            <div
              className={i === days.length - 1 ? ui.admin.barToday : ui.admin.bar}
              // Висота — дані, а не стиль, тому inline. Мінімум 4px, щоб нуль було видно.
              style={{ height: `${Math.max(4, (d.count / max) * 150)}px` }}
              aria-hidden="true"
            />
            <span className={ui.admin.barLabel}>{formatWeekdayShort(d.date)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TopServices({ items }: { items: AdminStats['top_services'] }) {
  const max = Math.max(1, ...items.map((s) => s.subscriptions));
  return (
    <Card as="section" aria-label="Популярні сервіси" className={ui.layout.cardStack}>
      <div className={ui.layout.cardHeader}>
        <h2 className={ui.layout.cardTitle}>Популярні сервіси</h2>
        <Link to="/admin/catalog" className={ui.link.small}>
          Каталог
        </Link>
      </div>
      {items.length === 0 ? (
        <EmptyState title="Підписок ще немає" description="Коли користувачі додадуть підписки, тут з’явиться топ сервісів." />
      ) : (
        <ul className={ui.admin.topList}>
          {items.map((s) => (
            <li key={s.id} className={ui.admin.topRow}>
              <ServiceIcon name={s.name} icon={s.icon} brandColor={s.brand_color} />
              <div className={ui.admin.topBody}>
                <div className={ui.admin.topHead}>
                  <span className={ui.admin.topName}>{s.name}</span>
                  <span className={ui.admin.topCount}>{s.subscriptions} підп.</span>
                </div>
                <div className={ui.admin.track} aria-hidden="true">
                  <div className={ui.admin.fill} style={{ width: `${Math.round((s.subscriptions / max) * 100)}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ratesText(rates: AdminRate[]): string {
  if (rates.length === 0) return 'Курсів ще немає';
  const head = rates[0];
  const values = rates.map((r) => `${r.currency} ${formatRate(r.rate)}`).join(' · ');
  return `${head.source === 'nbu' ? 'НБУ' : 'Резервний'} на ${head.rate_date} · ${values}`;
}

/** Ручне оновлення курсів НБУ з повідомленням про результат. */
export function useRatesRefresh(onDone: () => void) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const refresh = useCallback(async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await api.admin.refreshRates();
      setResult({ ok: true, message: res.message });
      onDone();
    } catch (e) {
      setResult({ ok: false, message: e instanceof Error ? e.message : 'Не вдалося оновити курси' });
    } finally {
      setBusy(false);
    }
  }, [onDone]);
  return { refresh, busy, result };
}

/** Стан фонових задач: курси НБУ, нагадування бота, база даних. */
export function BackgroundJobs({ stats, onRatesUpdated }: { stats: AdminStats; onRatesUpdated: () => void }) {
  const { refresh, busy, result } = useRatesRefresh(onRatesUpdated);
  const nbu = stats.rates[0]?.source === 'nbu';
  return (
    <Card as="section" variant="base" aria-label="Фонові задачі" className={ui.admin.flushCard}>
      <h2 className={ui.admin.flushTitle}>Фонові задачі</h2>
      <div className={ui.admin.jobRow}>
        <div className={ui.admin.jobMain}>
          <span className={ui.admin.jobTitle}>Курси НБУ</span>
          <span className={ui.admin.jobInfo}>
            {ratesText(stats.rates)}
            {stats.rates[0] && ` · отримано ${formatDateTime(stats.rates[0].fetched_at)}`}
          </span>
          {result && <span className={result.ok ? ui.admin.jobInfo : ui.error}>{result.message}</span>}
        </div>
        <Badge variant={nbu ? 'success' : 'warning'} dot>
          {nbu ? 'Оновлено' : 'Резервні'}
        </Badge>
        <Button variant="secondary" onClick={refresh} loading={busy}>
          Оновити зараз
        </Button>
      </div>
      <div className={ui.admin.jobRow}>
        <div className={ui.admin.jobMain}>
          <span className={ui.admin.jobTitle}>Telegram-нагадування</span>
          <span className={ui.admin.jobInfo}>Перевірка щогодини · сьогодні надіслано {stats.reminders_today}</span>
        </div>
        <Link to="/admin/system" className={cn(ui.btn.secondary)}>
          Журнал
        </Link>
      </div>
      <div className={ui.admin.jobRow}>
        <div className={ui.admin.jobMain}>
          <span className={ui.admin.jobTitle}>База даних SQLite</span>
          <span className={ui.admin.jobInfo}>
            {stats.database.journal_mode.toUpperCase()} · {stats.database.tables} таблиць ·{' '}
            {formatBytes(stats.database.size_bytes)}
          </span>
        </div>
        <Badge variant="info" dot>
          Справна
        </Badge>
      </div>
    </Card>
  );
}
