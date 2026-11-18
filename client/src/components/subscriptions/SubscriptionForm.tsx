import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { CustomPlanInput, CustomServiceInput } from '@shared/domain';
import { ApiError } from '@/api/client';
import { Alert, Button, Checkbox, Field, Modal, Select, ServiceIcon } from '@/components/ui';
import { useZodForm } from '@/hooks/useZodForm';
import { billingPeriodAdverbs, currencyLabels, formatMoney } from '@/lib/format';
import type { BillingPeriod, Catalog, Currency, PaymentMethod, Subscription } from '@/lib/types';
import { cn } from '@/lib/cn';
import { ui } from '@/lib/ui';
import {
  API_FIELD_TO_FORM,
  CUSTOM,
  emptyFormValues,
  subscriptionFormSchema,
  valuesFromSubscription,
  type SubscriptionFormValues,
} from './subscriptionFormSchema';

/** Дані для створення/оновлення підписки після того, як власні сервіс/тариф уже створено. */
export interface SubscriptionSaveData {
  plan_id: number;
  payment_method_id: number | null;
  start_date: string;
  trial_end_date: string | null;
  auto_renew: boolean;
}

export interface SubscriptionFormProps {
  open: boolean;
  onClose: () => void;
  /** null — нова підписка. */
  subscription: Subscription | null;
  catalog: Catalog;
  paymentMethods: PaymentMethod[];
  addService: (data: CustomServiceInput) => Promise<{ id: number }>;
  addPlan: (data: CustomPlanInput) => Promise<{ id: number }>;
  onSave: (data: SubscriptionSaveData) => Promise<void>;
}

const PERIOD_OPTIONS = (Object.keys(billingPeriodAdverbs) as BillingPeriod[]).map((p) => ({
  value: p,
  label: billingPeriodAdverbs[p],
}));
const CURRENCY_OPTIONS = (Object.keys(currencyLabels) as Currency[]).map((c) => ({ value: c, label: currencyLabels[c] }));

/** Перекладає ключі помилок API на поля форми. */
function remapApiError(e: unknown): never {
  if (e instanceof ApiError) {
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(e.fields)) fields[API_FIELD_TO_FORM[k] ?? k] = v;
    throw new ApiError(e.status, e.message, fields, e.body);
  }
  throw e;
}

interface FormBodyProps extends Omit<SubscriptionFormProps, 'open'> {
  formId: string;
  onSubmittingChange: (submitting: boolean) => void;
}

function FormBody({
  formId,
  onSubmittingChange,
  onClose,
  subscription,
  catalog,
  paymentMethods,
  addService,
  addPlan,
  onSave,
}: FormBodyProps) {
  const defaultMethod = paymentMethods.find((m) => m.is_default)?.id ?? null;
  const initial = useMemo(
    () => (subscription ? valuesFromSubscription(subscription) : emptyFormValues(defaultMethod)),
    [subscription, defaultMethod],
  );

  const onValid = useCallback(
    async (v: SubscriptionFormValues) => {
      try {
        let serviceId = Number(v.service);
        if (v.service === CUSTOM) {
          const s = await addService({ name: v.customServiceName.trim(), category_id: Number(v.customCategoryId) });
          serviceId = s.id;
        }
        let planId = Number(v.plan);
        if (v.service === CUSTOM || v.plan === CUSTOM) {
          const p = await addPlan({
            service_id: serviceId,
            name: v.customPlanName.trim(),
            price: Number(v.customPrice.replace(',', '.')),
            currency: v.customCurrency ?? 'UAH',
            billing_period: v.customPeriod ?? 'month',
          });
          planId = p.id;
        }
        await onSave({
          plan_id: planId,
          payment_method_id: v.paymentMethodId ? Number(v.paymentMethodId) : null,
          start_date: v.startDate,
          trial_end_date: v.hasTrial ? v.trialEndDate : null,
          auto_renew: v.autoRenew,
        });
        onClose();
      } catch (e) {
        remapApiError(e);
      }
    },
    [addService, addPlan, onSave, onClose],
  );

  const form = useZodForm(subscriptionFormSchema, initial, onValid);
  const v = form.values;
  useEffect(() => onSubmittingChange(form.submitting), [form.submitting, onSubmittingChange]);

  const service = catalog.services.find((s) => String(s.id) === v.service) ?? null;
  const plan = service?.plans.find((p) => String(p.id) === v.plan) ?? null;
  const customService = v.service === CUSTOM;
  const customPlan = customService || v.plan === CUSTOM;

  const serviceOptions = [
    ...catalog.services.map((s) => ({ value: String(s.id), label: `${s.name} · ${s.category}${s.is_custom ? ' (власний)' : ''}` })),
    { value: CUSTOM, label: 'Додати власний сервіс…' },
  ];
  const planOptions = service
    ? [
        ...service.plans.map((p) => ({
          value: String(p.id),
          label: `${p.name} — ${formatMoney(p.price, p.currency)} / ${billingPeriodAdverbs[p.billing_period].toLowerCase()}`,
        })),
        { value: CUSTOM, label: 'Власний тариф…' },
      ]
    : [];

  return (
    <form id={formId} noValidate onSubmit={form.handleSubmit} className={ui.field.form}>
        {form.formError && <Alert variant="error">{form.formError}</Alert>}
        <div className={ui.modal.grid}>
          <div className={ui.list.cell}>
            {service && <ServiceIcon name={service.name} icon={service.icon} brandColor={service.brand_color} />}
            <Field label="Сервіс" error={form.errorFor('service')}>
              {(c) => (
                <Select
                  {...c}
                  name="service"
                  value={v.service}
                  placeholder="Оберіть сервіс"
                  options={serviceOptions}
                  onValueChange={(val) => {
                    form.setField('service', val);
                    form.setField('plan', '');
                  }}
                />
              )}
            </Field>
          </div>

          {!customService && (
            <Field label="Тариф" error={form.errorFor('plan')} hint={!service ? 'Спершу оберіть сервіс' : undefined}>
              {(c) => (
                <Select
                  {...c}
                  name="plan"
                  value={v.plan}
                  disabled={!service}
                  placeholder="Оберіть тариф"
                  options={planOptions}
                  onValueChange={(val) => form.setField('plan', val)}
                />
              )}
            </Field>
          )}

          {customService && (
            <>
              <Field
                label="Назва сервісу"
                name="customServiceName"
                placeholder="Напр., Megogo"
                value={v.customServiceName}
                onValueChange={(val) => form.setField('customServiceName', val)}
                onBlur={() => form.blurField('customServiceName')}
                error={form.errorFor('customServiceName')}
              />
              <Field label="Категорія" error={form.errorFor('customCategoryId')}>
                {(c) => (
                  <Select
                    {...c}
                    name="customCategoryId"
                    value={v.customCategoryId}
                    placeholder="Оберіть категорію"
                    options={catalog.categories.map((cat) => ({ value: String(cat.id), label: cat.name }))}
                    onValueChange={(val) => form.setField('customCategoryId', val)}
                  />
                )}
              </Field>
            </>
          )}

          {customPlan && (
            <>
              <Field
                label="Назва тарифу"
                name="customPlanName"
                placeholder="Напр., Преміум"
                value={v.customPlanName}
                onValueChange={(val) => form.setField('customPlanName', val)}
                onBlur={() => form.blurField('customPlanName')}
                error={form.errorFor('customPlanName')}
              />
              <Field
                label="Ціна"
                name="customPrice"
                inputMode="decimal"
                placeholder="0.00"
                value={v.customPrice}
                onValueChange={(val) => form.setField('customPrice', val)}
                onBlur={() => form.blurField('customPrice')}
                error={form.errorFor('customPrice')}
              />
              <Field label="Валюта" error={form.errorFor('customCurrency')}>
                {(c) => (
                  <Select
                    {...c}
                    name="customCurrency"
                    value={v.customCurrency}
                    options={CURRENCY_OPTIONS}
                    onValueChange={(val) => form.setField('customCurrency', val as Currency)}
                  />
                )}
              </Field>
              <Field label="Період оплати" error={form.errorFor('customPeriod')}>
                {(c) => (
                  <Select
                    {...c}
                    name="customPeriod"
                    value={v.customPeriod}
                    options={PERIOD_OPTIONS}
                    onValueChange={(val) => form.setField('customPeriod', val as BillingPeriod)}
                  />
                )}
              </Field>
            </>
          )}

          {plan && !customPlan && (
            <p className={cn(ui.hint, ui.modal.full)}>
              {formatMoney(plan.price, plan.currency)} · {billingPeriodAdverbs[plan.billing_period].toLowerCase()}
            </p>
          )}

          <Field label="Спосіб оплати" error={form.errorFor('paymentMethodId')}>
            {(c) => (
              <Select
                {...c}
                name="paymentMethodId"
                value={v.paymentMethodId}
                options={[{ value: '', label: 'Не вказано' }, ...paymentMethods.map((m) => ({ value: String(m.id), label: m.label }))]}
                onValueChange={(val) => form.setField('paymentMethodId', val)}
              />
            )}
          </Field>
          <Field
            label="Дата початку"
            name="startDate"
            type="date"
            value={v.startDate}
            onValueChange={(val) => form.setField('startDate', val)}
            onBlur={() => form.blurField('startDate')}
            error={form.errorFor('startDate')}
          />

          <Checkbox
            name="hasTrial"
            label="Пробний період"
            checked={v.hasTrial}
            onCheckedChange={(val) => form.setField('hasTrial', val)}
          />
          {v.hasTrial ? (
            <Field
              label="Кінець пробного періоду"
              name="trialEndDate"
              type="date"
              value={v.trialEndDate}
              onValueChange={(val) => form.setField('trialEndDate', val)}
              onBlur={() => form.blurField('trialEndDate')}
              error={form.errorFor('trialEndDate')}
              hint="Перше списання — у цей день"
            />
          ) : (
            <span aria-hidden="true" />
          )}

          <Checkbox
            name="autoRenew"
            label="Автопродовження"
            checked={v.autoRenew}
            onCheckedChange={(val) => form.setField('autoRenew', val)}
          />
        </div>
    </form>
  );
}

/** Створення/редагування підписки в модальному вікні. */
export function SubscriptionForm({ open, ...props }: SubscriptionFormProps) {
  const formId = useId();
  const [submitting, setSubmitting] = useState(false);
  return (
    <Modal
      open={open}
      onClose={() => !submitting && props.onClose()}
      title={props.subscription ? 'Редагувати підписку' : 'Нова підписка'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={props.onClose} disabled={submitting}>
            Скасувати
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {props.subscription ? 'Зберегти зміни' : 'Зберегти підписку'}
          </Button>
        </>
      }
    >
      <FormBody {...props} formId={formId} onSubmittingChange={setSubmitting} />
    </Modal>
  );
}
