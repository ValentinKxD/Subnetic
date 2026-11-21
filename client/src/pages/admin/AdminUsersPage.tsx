import { useEffect, useRef, useState } from 'react';
import * as api from '@/api/endpoints';
import { AdminSections } from '@/components/admin/AdminSections';
import { Pager } from '@/components/admin/Pager';
import { UserCard } from '@/components/admin/UserCard';
import { Badge, Button, Card, EditIcon, EmptyState, ErrorState, Field, PageHeader, SearchIcon, Select, Spinner } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/AuthContext';
import { useDebounced } from '@/hooks/useDebounced';
import { formatDate, initials, usersWord } from '@/lib/format';
import type { AdminUser, AdminUserList } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';

interface Filters {
  q: string;
  role: '' | 'user' | 'admin';
  telegram: '' | 'linked' | 'unlinked';
  status: '' | 'active' | 'blocked';
}

const DEFAULT_FILTERS: Filters = { q: '', role: '', telegram: '', status: '' };

type Chip = 'all' | 'active' | 'admins' | 'blocked';

function activeChip(f: Filters): Chip | null {
  if (f.status === 'blocked' && f.role === '') return 'blocked';
  if (f.status === 'active' && f.role === '') return 'active';
  if (f.role === 'admin' && f.status === '') return 'admins';
  if (f.role === '' && f.status === '') return 'all';
  return null;
}

const CHIPS: Array<{ chip: Chip; label: string; patch: Pick<Filters, 'role' | 'status'>; count: keyof AdminUserList['counts'] }> = [
  { chip: 'all', label: 'Усі', patch: { role: '', status: '' }, count: 'all' },
  { chip: 'active', label: 'Активні', patch: { role: '', status: 'active' }, count: 'active' },
  { chip: 'admins', label: 'Адміністратори', patch: { role: 'admin', status: '' }, count: 'admins' },
  { chip: 'blocked', label: 'Заблоковані', patch: { role: '', status: 'blocked' }, count: 'blocked' },
];

function StatusBadge({ user }: { user: AdminUser }) {
  return user.blocked_at ? (
    <Badge variant="danger" dot>
      Заблокований
    </Badge>
  ) : (
    <Badge variant="success" dot>
      Активний
    </Badge>
  );
}

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const q = useDebounced(filters.q);
  const list = useAsync(
    (signal) => api.admin.users({ q, role: filters.role, telegram: filters.telegram, status: filters.status, page }, signal),
    [q, filters.role, filters.telegram, filters.status, page],
  );
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const asideRef = useRef<HTMLDivElement>(null);

  // Нові фільтри — з першої сторінки.
  useEffect(() => setPage(1), [q, filters.role, filters.telegram, filters.status]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function select(u: AdminUser) {
    setSelected(u);
    // На вузькому екрані картка під таблицею — прокручуємо до неї.
    if (window.matchMedia('(max-width: 1279px)').matches) {
      requestAnimationFrame(() => asideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  const data = list.data;
  const chip = activeChip(filters);
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
  const subtitle = data
    ? `${data.counts.all} ${usersWord(data.counts.all)} · адміністраторів ${data.counts.admins} · заблоковано ${data.counts.blocked}`
    : undefined;

  return (
    <div className={ui.layout.stack}>
      <PageHeader title="Адмін-панель" subtitle={subtitle} />
      <AdminSections />

      <Card as="section" aria-label="Фільтри" className={ui.layout.cardStack}>
        <div className={ui.layout.toolbar}>
          <Field
            label="Пошук"
            type="search"
            placeholder="Нікнейм або email"
            leadingIcon={<SearchIcon size={20} />}
            value={filters.q}
            onValueChange={(v) => set('q', v)}
            wrapperClassName={ui.filters.search}
          />
          <Field label="Роль" wrapperClassName={ui.filters.narrow}>
            {(control) => (
              <Select
                {...control}
                value={filters.role}
                onValueChange={(v) => set('role', v as Filters['role'])}
                options={[
                  { value: '', label: 'Усі ролі' },
                  { value: 'user', label: 'Користувач' },
                  { value: 'admin', label: 'Адміністратор' },
                ]}
              />
            )}
          </Field>
          <Field label="Telegram" wrapperClassName={ui.filters.narrow}>
            {(control) => (
              <Select
                {...control}
                value={filters.telegram}
                onValueChange={(v) => set('telegram', v as Filters['telegram'])}
                options={[
                  { value: '', label: 'Усі' },
                  { value: 'linked', label: 'Прив’язано' },
                  { value: 'unlinked', label: 'Не прив’язано' },
                ]}
              />
            )}
          </Field>
          <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)} disabled={isDefault}>
            Скинути
          </Button>
        </div>
        <div className={ui.chip.group} role="group" aria-label="Статус">
          {CHIPS.map((c) => (
            <button
              key={c.chip}
              type="button"
              aria-pressed={chip === c.chip}
              onClick={() => setFilters((f) => ({ ...f, ...c.patch }))}
              className={chip === c.chip ? ui.chip.on : ui.chip.off}
            >
              {c.label}
              {data && <span className={ui.chip.count}>{data.counts[c.count]}</span>}
            </button>
          ))}
        </div>
      </Card>

      <div className={selected ? ui.admin.withAside : ui.layout.stack}>
        <section aria-label="Список користувачів" aria-busy={list.refreshing}>
          {list.loading ? (
            <Card className={ui.layout.loadingCard}>
              <Spinner size="lg" label="Завантаження користувачів" />
            </Card>
          ) : list.error && !data ? (
            <Card variant="base">
              <ErrorState message={list.error} onRetry={list.reload} />
            </Card>
          ) : data && data.items.length === 0 ? (
            <Card variant="base">
              <EmptyState
                title={isDefault ? 'Користувачів ще немає' : 'Нікого не знайдено'}
                description={isDefault ? undefined : 'Спробуйте змінити пошук або фільтри.'}
              />
            </Card>
          ) : data ? (
            <div className={ui.table.wrapper}>
              <table className={cn(ui.table.table, ui.admin.table)}>
                <caption className={ui.srOnly}>Користувачі</caption>
                <thead className={ui.table.head}>
                  <tr>
                    {['Користувач', 'Роль', 'Telegram', 'Підписок', 'Реєстрація', 'Статус'].map((h) => (
                      <th key={h} scope="col" className={ui.table.th}>
                        {h}
                      </th>
                    ))}
                    <th scope="col" className={ui.table.th}>
                      <span className={ui.srOnly}>Дії</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((u) => (
                    <tr key={u.id} className={selected?.id === u.id ? ui.admin.rowSelected : ui.table.row}>
                      <td className={ui.table.td}>
                        <div className={ui.admin.userCell}>
                          <span className={ui.admin.avatar} aria-hidden="true">
                            {initials(u.nickname)}
                          </span>
                          <div className={ui.list.main}>
                            <span className={ui.list.title}>
                              {u.nickname}
                              {u.id === me?.id && ' (ви)'}
                            </span>
                            <span className={ui.list.meta}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className={ui.table.td}>{u.role === 'admin' ? 'Адміністратор' : 'Користувач'}</td>
                      <td className={ui.table.tdMuted}>
                        {u.telegram_linked ? (u.telegram_username ? `@${u.telegram_username}` : 'так') : '—'}
                      </td>
                      <td className={ui.table.td}>{u.subscriptions}</td>
                      <td className={ui.table.tdMuted}>{formatDate(u.created_at)}</td>
                      <td className={ui.table.td}>
                        <StatusBadge user={u} />
                      </td>
                      <td className={ui.table.tdActions}>
                        <button
                          type="button"
                          aria-label={`Керувати: ${u.nickname}`}
                          title="Керувати"
                          className={ui.iconBtn.neutral}
                          onClick={() => select(u)}
                        >
                          <EditIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pager page={data.page} pageSize={data.page_size} total={data.total} onPage={setPage} />
            </div>
          ) : null}
        </section>

        {selected && (
          <div ref={asideRef}>
            <UserCard
              key={selected.id}
              user={selected}
              isSelf={selected.id === me?.id}
              onChanged={(u) => {
                setSelected(u);
                list.reload();
              }}
              onDeleted={() => {
                setSelected(null);
                list.reload();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
