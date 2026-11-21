import { useEffect, useRef, useState } from 'react';
import * as api from '@/api/endpoints';
import { AdminSections } from '@/components/admin/AdminSections';
import { CategoriesDialog } from '@/components/admin/CategoriesDialog';
import { Pager } from '@/components/admin/Pager';
import { ServiceEditor } from '@/components/admin/ServiceEditor';
import { ServiceCell } from '@/components/common/ServiceCell';
import { Button, Card, EditIcon, EmptyState, ErrorState, Field, PageHeader, PlusIcon, SearchIcon, Select, Spinner } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { useDebounced } from '@/hooks/useDebounced';
import type { AdminCustomService, AdminService } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';

type View = 'global' | 'custom';

/** Редактор відкрито для нового сервісу (service = null) або для наявного. key не змінюється після створення. */
type Editor = { key: string; service: AdminService | null } | null;

function siteLabel(url: string | null): string {
  if (!url) return '—';
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

function CustomServicesTable({ items }: { items: AdminCustomService[] }) {
  if (items.length === 0) {
    return (
      <Card variant="base">
        <EmptyState title="Власних сервісів немає" description="Тут з’являться сервіси, які користувачі додали самі, бо їх немає в каталозі." />
      </Card>
    );
  }
  return (
    <div className={ui.table.wrapper}>
      <table className={cn(ui.table.table, ui.admin.table)}>
        <caption className={ui.srOnly}>Власні сервіси користувачів</caption>
        <thead className={ui.table.head}>
          <tr>
            {['Назва', 'Категорія', 'Користувачів', 'Підписок'].map((h) => (
              <th key={h} scope="col" className={ui.table.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.name} className={ui.table.row}>
              <td className={ui.table.td}>
                <ServiceCell name={s.name} icon="" brandColor="#64748B" />
              </td>
              <td className={ui.table.tdMuted}>{s.categories.split(',').join(', ')}</td>
              <td className={ui.table.td}>{s.users}</td>
              <td className={ui.table.td}>{s.subscriptions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={ui.table.footer}>
        Популярні власні сервіси варто додати в глобальний каталог — кнопкою «Додати сервіс».
      </div>
    </div>
  );
}

export function AdminCatalogPage() {
  const [view, setView] = useState<View>('global');
  const [qRaw, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(qRaw);

  const categories = useAsync((signal) => api.admin.categories(signal), []);
  const services = useAsync((signal) => api.admin.services({ q, category, page }, signal), [q, category, page]);
  const custom = useAsync(
    (signal) => (view === 'custom' ? api.admin.customServices(signal) : Promise.resolve(null)),
    [view],
  );

  const [editor, setEditor] = useState<Editor>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const asideRef = useRef<HTMLDivElement>(null);

  useEffect(() => setPage(1), [q, category]);

  function openEditor(next: Editor) {
    setEditor(next);
    if (window.matchMedia('(max-width: 1279px)').matches) {
      requestAnimationFrame(() => asideRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  const data = services.data;
  const cats = categories.data?.items ?? [];
  const summary = data?.summary;
  const filtered = qRaw !== '' || category !== '';

  return (
    <div className={ui.layout.stack}>
      <PageHeader
        title="Адмін-панель"
        subtitle={
          summary
            ? `Глобальний каталог: ${summary.categories} категорій · ${summary.services} сервісів · ${summary.plans} тарифів`
            : undefined
        }
        actions={
          <div className={ui.admin.actions}>
            <Button variant="secondary" onClick={() => setCategoriesOpen(true)} disabled={!categories.data}>
              Категорії
            </Button>
            <Button onClick={() => openEditor({ key: `new-${Date.now()}`, service: null })} disabled={cats.length === 0}>
              <PlusIcon />
              Додати сервіс
            </Button>
          </div>
        }
      />
      <AdminSections />

      <Card as="section" aria-label="Фільтри" className={ui.layout.toolbar}>
        {view === 'global' && (
          <>
            <Field
              label="Пошук"
              type="search"
              placeholder="Назва сервісу"
              leadingIcon={<SearchIcon size={20} />}
              value={qRaw}
              onValueChange={setQ}
              wrapperClassName={ui.filters.search}
            />
            <Field label="Категорія" wrapperClassName={ui.filters.select}>
              {(control) => (
                <Select
                  {...control}
                  value={category}
                  onValueChange={setCategory}
                  options={[{ value: '', label: 'Усі категорії' }, ...cats.map((c) => ({ value: String(c.id), label: c.name }))]}
                />
              )}
            </Field>
          </>
        )}
        <Field label="Показати" wrapperClassName={ui.filters.select}>
          {(control) => (
            <Select
              {...control}
              value={view}
              onValueChange={(v) => {
                setView(v as View);
                setEditor(null);
              }}
              options={[
                { value: 'global', label: 'Глобальний каталог' },
                { value: 'custom', label: 'Власні сервіси користувачів' },
              ]}
            />
          )}
        </Field>
      </Card>

      <div className={editor ? ui.admin.withAside : ui.layout.stack}>
        <section aria-label={view === 'global' ? 'Сервіси' : 'Власні сервіси'} aria-busy={services.refreshing}>
          {view === 'custom' ? (
            custom.loading || !custom.data ? (
              custom.error ? (
                <Card variant="base">
                  <ErrorState message={custom.error} onRetry={custom.reload} />
                </Card>
              ) : (
                <Card className={ui.layout.loadingCard}>
                  <Spinner size="lg" label="Завантаження" />
                </Card>
              )
            ) : (
              <CustomServicesTable items={custom.data.items} />
            )
          ) : services.loading ? (
            <Card className={ui.layout.loadingCard}>
              <Spinner size="lg" label="Завантаження каталогу" />
            </Card>
          ) : services.error && !data ? (
            <Card variant="base">
              <ErrorState message={services.error} onRetry={services.reload} />
            </Card>
          ) : data && data.items.length === 0 ? (
            <Card variant="base">
              <EmptyState
                title={filtered ? 'Нічого не знайдено' : 'Каталог порожній'}
                description={filtered ? 'Спробуйте змінити пошук або категорію.' : 'Додайте перший сервіс кнопкою «Додати сервіс».'}
              />
            </Card>
          ) : data ? (
            <div className={ui.table.wrapper}>
              <table className={cn(ui.table.table, ui.admin.table)}>
                <caption className={ui.srOnly}>Сервіси каталогу</caption>
                <thead className={ui.table.head}>
                  <tr>
                    {['Сервіс', 'Сайт', 'Тарифів', 'Підписок'].map((h) => (
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
                  {data.items.map((s) => (
                    <tr key={s.id} className={editor?.service?.id === s.id ? ui.admin.rowSelected : ui.table.row}>
                      <td className={ui.table.td}>
                        <ServiceCell name={s.name} icon={s.icon ?? ''} brandColor={s.brand_color} meta={s.category} />
                      </td>
                      <td className={ui.table.tdMuted}>{siteLabel(s.website)}</td>
                      <td className={ui.table.td}>{s.plans_count}</td>
                      <td className={ui.table.td}>{s.subscriptions}</td>
                      <td className={ui.table.tdActions}>
                        <button
                          type="button"
                          aria-label={`Редагувати ${s.name}`}
                          title="Редагувати"
                          className={ui.iconBtn.neutral}
                          onClick={() => openEditor({ key: `s-${s.id}`, service: s })}
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

        {editor && view === 'global' && (
          <div ref={asideRef}>
            <ServiceEditor
              key={editor.key}
              service={editor.service}
              categories={cats}
              onSaved={(s) => {
                setEditor((e) => (e ? { ...e, service: s } : e));
                services.reload();
                categories.reload();
              }}
              onDeleted={() => {
                setEditor(null);
                services.reload();
                categories.reload();
              }}
              onClose={() => setEditor(null)}
            />
          </div>
        )}
      </div>

      <CategoriesDialog
        open={categoriesOpen}
        categories={cats}
        onClose={() => setCategoriesOpen(false)}
        onChanged={() => {
          categories.reload();
          services.reload();
        }}
      />
    </div>
  );
}
