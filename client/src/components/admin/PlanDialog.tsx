import { useEffect, useState } from 'react';
import { adminPlanSchema } from '@shared/admin';
import { fieldErrors } from '@shared/auth';
import { ApiError } from '@/api/client';
import * as api from '@/api/endpoints';
import { Alert, Button, Field, Modal, Select } from '@/components/ui';
import { billingPeriodLabels } from '@/lib/format';
import type { AdminPlan, AdminService, BillingPeriod, Currency } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface PlanDialogProps {
  open: boolean;
  service: AdminService;
  /** null — новий тариф. */
  plan: AdminPlan | null;
  onClose: () => void;
  onSaved: (service: AdminService) => void;
}

interface Values {
  name: string;
  price: string;
  currency: Currency;
  billing_period: BillingPeriod;
}

const EMPTY: Values = { name: '', price: '', currency: 'UAH', billing_period: 'month' };

/** Додавання або редагування глобального тарифу сервісу. */
export function PlanDialog({ open, service, plan, onClose, onSaved }: PlanDialogProps) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(plan ? { ...plan, price: String(plan.price) } : EMPTY);
    setErrors({});
    setFormError(null);
  }, [open, plan]);

  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((s) => ({ ...s, [k]: v }));

  async function save() {
    const parsed = adminPlanSchema.safeParse({
      ...values,
      price: values.price.trim() === '' ? NaN : Number(values.price.replace(',', '.')),
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setBusy(true);
    setErrors({});
    setFormError(null);
    try {
      const updated = plan ? await api.admin.updatePlan(plan.id, parsed.data) : await api.admin.createPlan(service.id, parsed.data);
      onSaved(updated);
      onClose();
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fields);
      setFormError(e instanceof Error ? e.message : 'Не вдалося зберегти тариф');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title={plan ? `Тариф «${plan.name}»` : `Новий тариф · ${service.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Скасувати
          </Button>
          <Button onClick={save} loading={busy}>
            Зберегти
          </Button>
        </>
      }
    >
      <div className={ui.field.form}>
        {formError && <Alert variant="error">{formError}</Alert>}
        {plan && plan.subscriptions > 0 && (
          <Alert variant="info">
            На тариф є підписки ({plan.subscriptions}): нова ціна одразу застосується до майбутніх платежів користувачів.
          </Alert>
        )}
        <Field label="Назва" value={values.name} onValueChange={(v) => set('name', v)} error={errors.name} placeholder="Individual" />
        <div className={ui.admin.formGrid}>
          <Field
            label="Ціна"
            inputMode="decimal"
            value={values.price}
            onValueChange={(v) => set('price', v)}
            error={errors.price}
            placeholder="199"
          />
          <Field label="Валюта" error={errors.currency}>
            {(control) => (
              <Select
                {...control}
                value={values.currency}
                onValueChange={(v) => set('currency', v as Currency)}
                options={(['UAH', 'USD', 'EUR'] as const).map((c) => ({ value: c, label: c }))}
              />
            )}
          </Field>
        </div>
        <Field label="Період" error={errors.billing_period}>
          {(control) => (
            <Select
              {...control}
              value={values.billing_period}
              onValueChange={(v) => set('billing_period', v as BillingPeriod)}
              options={(Object.keys(billingPeriodLabels) as BillingPeriod[]).map((p) => ({
                value: p,
                label: billingPeriodLabels[p],
              }))}
            />
          )}
        </Field>
      </div>
    </Modal>
  );
}
