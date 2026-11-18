import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, ConfirmDialog, EmptyState, ErrorState, PageHeader, PlusIcon, Spinner } from '@/components/ui';
import { SubscriptionFilters } from '@/components/subscriptions/SubscriptionFilters';
import { SubscriptionForm, type SubscriptionSaveData } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList';
import { useCatalog } from '@/hooks/useCatalog';
import { useDebounced } from '@/hooks/useDebounced';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import {
  DEFAULT_SUBSCRIPTION_FILTERS,
  useSubscriptions,
  type SubscriptionFiltersValue,
} from '@/hooks/useSubscriptions';
import { statusLabels, subscriptionsWord } from '@/lib/format';
import type { Subscription, SubscriptionStatus } from '@/lib/types';
import { ui } from '@/lib/ui';

type FormState = { open: false } | { open: true; subscription: Subscription | null };

export function SubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState<SubscriptionFiltersValue>(DEFAULT_SUBSCRIPTION_FILTERS);
  const debouncedQ = useDebounced(filters.q);
  const subs = useSubscriptions({ ...filters, q: debouncedQ });
  const catalog = useCatalog();
  const methods = usePaymentMethods();

  const [form, setForm] = useState<FormState>({ open: false });
  const [toDelete, setToDelete] = useState<Subscription | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // «Додати підписку» з дашборда: /subscriptions?new=1
  useEffect(() => {
    if (params.get('new') === '1') {
      setForm({ open: true, subscription: null });
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const handleSave = useCallback(
    async (data: SubscriptionSaveData) => {
      if (form.open && form.subscription) await subs.update(form.subscription.id, data);
      else await subs.create(data);
      catalog.reload(); // власні сервіси/тарифи могли з'явитися
    },
    [form, subs, catalog],
  );

  const handleStatus = useCallback(
    async (s: Subscription, status: SubscriptionStatus) => {
      setActionError(null);
      try {
        await subs.setStatus(s.id, status);
      } catch (e) {
        setActionError(`Не вдалося змінити статус «${s.service.name}» на «${statusLabels[status]}»: ${e instanceof Error ? e.message : ''}`);
      }
    },
    [subs],
  );

  const data = subs.data;
  const total = data?.counts.all ?? 0;
  const subtitle = data
    ? `${total} ${subscriptionsWord(total)} · ${data.counts.active + data.counts.trial} активних`
    : undefined;
  const filtered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_SUBSCRIPTION_FILTERS);
  const canOpenForm = catalog.data !== null;

  return (
    <div className={ui.layout.stack}>
      <PageHeader
        title="Підписки"
        subtitle={subtitle}
        actions={
          <Button onClick={() => setForm({ open: true, subscription: null })} disabled={!canOpenForm}>
            <PlusIcon />
            Додати підписку
          </Button>
        }
      />

      <SubscriptionFilters
        value={filters}
        onChange={setFilters}
        categories={catalog.data?.categories ?? []}
        counts={data?.counts ?? null}
      />

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {subs.loading ? (
        <Card className={ui.layout.loadingCard}>
          <Spinner size="lg" label="Завантаження підписок" />
        </Card>
      ) : subs.error && !data ? (
        <Card variant="base">
          <ErrorState message={subs.error} onRetry={subs.reload} />
        </Card>
      ) : data && data.items.length === 0 ? (
        <Card variant="base">
          {filtered ? (
            <EmptyState
              title="Нічого не знайдено"
              description="Спробуйте змінити пошук або фільтри."
              action={
                <Button variant="secondary" onClick={() => setFilters(DEFAULT_SUBSCRIPTION_FILTERS)}>
                  Скинути фільтри
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Ще немає підписок"
              description="Додайте першу підписку — і Subnetic нагадає про списання."
              action={
                <Button onClick={() => setForm({ open: true, subscription: null })} disabled={!canOpenForm}>
                  <PlusIcon />
                  Додати підписку
                </Button>
              }
            />
          )}
        </Card>
      ) : data ? (
        <div aria-busy={subs.refreshing}>
          <SubscriptionList
            items={data.items}
            onEdit={(s) => setForm({ open: true, subscription: s })}
            onStatus={handleStatus}
            onDelete={setToDelete}
          />
        </div>
      ) : null}

      {catalog.data && (
        <SubscriptionForm
          open={form.open}
          onClose={() => setForm({ open: false })}
          subscription={form.open ? form.subscription : null}
          catalog={catalog.data}
          paymentMethods={methods.items}
          addService={catalog.addService}
          addPlan={catalog.addPlan}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Видалити підписку?"
        confirmLabel="Видалити"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await subs.remove(toDelete.id);
        }}
      >
        <p>
          Підписку <strong>{toDelete?.service.name}</strong> буде видалено. Історія вже здійснених платежів збережеться.
        </p>
      </ConfirmDialog>
    </div>
  );
}
