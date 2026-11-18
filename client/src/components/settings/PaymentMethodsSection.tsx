import { useState } from 'react';
import {
  Badge,
  Button,
  CardIcon,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  PlusIcon,
  Spinner,
  StarIcon,
  TrashIcon,
} from '@/components/ui';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useSaveState } from '@/hooks/useSaveState';
import { paymentMethodTypeLabels } from '@/lib/format';
import type { PaymentMethod } from '@/lib/types';
import { ui } from '@/lib/ui';
import { PaymentMethodForm } from './PaymentMethodForm';
import { SettingsSection } from './SettingsSection';

/** Список способів оплати: додавання, «основний», видалення з підтвердженням. */
export function PaymentMethodsSection() {
  const methods = usePaymentMethods();
  const save = useSaveState();
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PaymentMethod | null>(null);

  return (
    <SettingsSection
      icon={<CardIcon size={20} />}
      title="Способи оплати"
      saveState={save.state}
      actions={
        <Button variant="secondary" onClick={() => setFormOpen(true)}>
          <PlusIcon />
          Додати спосіб оплати
        </Button>
      }
    >
      {methods.loading ? (
        <div className={ui.layout.loadingInline}>
          <Spinner size="lg" label="Завантаження способів оплати" />
        </div>
      ) : methods.error && !methods.data ? (
        <ErrorState message={methods.error} onRetry={methods.reload} />
      ) : methods.items.length === 0 ? (
        <EmptyState title="Способів оплати ще немає" description="Додайте картку або PayPal, щоб вказувати їх у підписках." />
      ) : (
        <ul className={ui.list.plain}>
          {methods.items.map((m) => (
            <li key={m.id} className={ui.list.row}>
              <span className={ui.list.iconBox} aria-hidden="true">
                <CardIcon size={20} />
              </span>
              <div className={ui.list.main}>
                <span className={ui.list.title}>{m.label}</span>
                <span className={ui.list.meta}>{m.details || paymentMethodTypeLabels[m.type]}</span>
              </div>
              {m.is_default ? (
                <Badge variant="accent">Основний</Badge>
              ) : (
                <button
                  type="button"
                  className={ui.iconBtn.neutral}
                  aria-label={`Зробити основним: ${m.label}`}
                  title="Зробити основним"
                  onClick={() => save.run(() => methods.makeDefault(m.id), `${m.label} — основний спосіб оплати`)}
                >
                  <StarIcon />
                </button>
              )}
              <button
                type="button"
                className={ui.iconBtn.danger}
                aria-label={`Видалити ${m.label}`}
                title="Видалити"
                onClick={() => setToDelete(m)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <PaymentMethodForm open={formOpen} onClose={() => setFormOpen(false)} onSave={methods.add} />

      <ConfirmDialog
        open={toDelete !== null}
        title="Видалити спосіб оплати?"
        confirmLabel="Видалити"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await methods.remove(toDelete.id);
        }}
      >
        <p>
          <strong>{toDelete?.label}</strong> буде видалено. У підписках, де він вказаний, спосіб оплати стане «Не вказано».
        </p>
      </ConfirmDialog>
    </SettingsSection>
  );
}
