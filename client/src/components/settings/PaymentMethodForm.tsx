import { useCallback, useEffect, useId, useState } from 'react';
import { paymentMethodInputSchema, type PaymentMethodInput, type PaymentMethodType } from '@shared/domain';
import { Alert, Button, Checkbox, Field, Modal, Select } from '@/components/ui';
import { useZodForm } from '@/hooks/useZodForm';
import { paymentMethodTypeLabels } from '@/lib/format';
import { ui } from '@/lib/ui';

const TYPE_OPTIONS = (Object.keys(paymentMethodTypeLabels) as PaymentMethodType[]).map((t) => ({
  value: t,
  label: paymentMethodTypeLabels[t],
}));

const INITIAL: PaymentMethodInput = { type: 'card', label: '', details: '', is_default: false };

function Body({
  formId,
  onSubmittingChange,
  onSave,
  onClose,
}: {
  formId: string;
  onSubmittingChange: (v: boolean) => void;
  onSave: (data: PaymentMethodInput) => Promise<unknown>;
  onClose: () => void;
}) {
  const onValid = useCallback(
    async (data: PaymentMethodInput) => {
      await onSave(data);
      onClose();
    },
    [onSave, onClose],
  );
  const form = useZodForm(paymentMethodInputSchema, INITIAL, onValid);
  useEffect(() => onSubmittingChange(form.submitting), [form.submitting, onSubmittingChange]);
  const v = form.values;
  const isCard = v.type === 'card';

  return (
    <form id={formId} noValidate onSubmit={form.handleSubmit} className={ui.field.form}>
      {form.formError && <Alert variant="error">{form.formError}</Alert>}
      <Field label="Тип" error={form.errorFor('type')}>
        {(c) => (
          <Select
            {...c}
            name="type"
            value={v.type}
            options={TYPE_OPTIONS}
            onValueChange={(val) => form.setField('type', val as PaymentMethodType)}
          />
        )}
      </Field>
      <Field
        label="Назва"
        name="label"
        placeholder={isCard ? 'Напр., Visa ·4242' : paymentMethodTypeLabels[v.type]}
        hint={isCard ? 'Лише останні 4 цифри — повний номер картки не потрібен' : undefined}
        value={v.label}
        onValueChange={(val) => form.setField('label', val)}
        onBlur={() => form.blurField('label')}
        error={form.errorFor('label')}
      />
      <Field
        label="Деталі"
        name="details"
        placeholder={isCard ? 'Напр., діє до 08/28' : 'Напр., email акаунта'}
        hint="Необов’язково"
        value={v.details ?? ''}
        onValueChange={(val) => form.setField('details', val)}
        onBlur={() => form.blurField('details')}
        error={form.errorFor('details')}
      />
      <Checkbox
        name="is_default"
        label="Зробити основним"
        checked={v.is_default ?? false}
        onCheckedChange={(val) => form.setField('is_default', val)}
      />
    </form>
  );
}

export interface PaymentMethodFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: PaymentMethodInput) => Promise<unknown>;
}

/** Додавання способу оплати в модальному вікні. Дані платіжних карток не вводяться — лише підпис. */
export function PaymentMethodForm({ open, onClose, onSave }: PaymentMethodFormProps) {
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title="Новий спосіб оплати"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Скасувати
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            Додати
          </Button>
        </>
      }
    >
      <Body formId={formId} onSubmittingChange={setSubmitting} onSave={onSave} onClose={onClose} />
    </Modal>
  );
}
