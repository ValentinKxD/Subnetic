import { Card, EmptyState } from '@/components/ui';
import { formatDateTime, formatShortDateTime } from '@/lib/format';
import type { AdminLogEntry } from '@/lib/types';
import { ui } from '@/lib/ui';

/** Останні записи admin_log: час, опис дії, хто виконав. */
export function AdminLogList({ items, title = 'Журнал дій' }: { items: AdminLogEntry[]; title?: string }) {
  return (
    <Card as="section" variant="base" aria-label={title} className={ui.admin.flushCard}>
      <h2 className={ui.admin.flushTitle}>{title}</h2>
      {items.length === 0 ? (
        <EmptyState title="Записів ще немає" description="Тут з’являться зміни, які виконують адміністратори." />
      ) : (
        <ul>
          {items.map((l) => (
            <li key={l.id} className={ui.admin.logRow}>
              <time dateTime={l.created_at} title={formatDateTime(l.created_at)} className={ui.admin.logTime}>
                {formatShortDateTime(l.created_at)}
              </time>
              <div className={ui.admin.logBody}>
                <span className={ui.admin.logText}>{l.details ?? l.action}</span>
                <span className={ui.admin.logMeta}>
                  {l.admin_nickname ?? 'система'} · {l.action}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
