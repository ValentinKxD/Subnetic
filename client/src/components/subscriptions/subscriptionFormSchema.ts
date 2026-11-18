import { z } from 'zod';
import { isISODate, todayISO } from '@shared/dates';
import { BILLING_PERIODS, CURRENCIES } from '@shared/money';
import type { Subscription } from '@/lib/types';

/** Значення select «Додати свій…». */
export const CUSTOM = '__custom';

/**
 * Схема форми підписки (рядки з полів вводу). Умовні правила:
 * власний сервіс → потрібні назва й категорія; власний тариф → назва, ціна, валюта, період;
 * пробний період → дата кінця після дати початку.
 */
export const subscriptionFormSchema = z
  .object({
    service: z.string(),
    customServiceName: z.string(),
    customCategoryId: z.string(),
    plan: z.string(),
    customPlanName: z.string(),
    customPrice: z.string(),
    customCurrency: z.enum(CURRENCIES),
    customPeriod: z.enum(BILLING_PERIODS),
    paymentMethodId: z.string(),
    startDate: z.string(),
    hasTrial: z.boolean(),
    trialEndDate: z.string(),
    autoRenew: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const req = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    const customService = v.service === CUSTOM;
    const customPlan = customService || v.plan === CUSTOM;

    if (!v.service) req('service', 'Оберіть сервіс');
    if (customService) {
      const name = v.customServiceName.trim();
      if (!name) req('customServiceName', 'Вкажіть назву сервісу');
      else if (name.length > 60) req('customServiceName', 'Максимум 60 символів');
      if (!v.customCategoryId) req('customCategoryId', 'Оберіть категорію');
    }

    if (!customService && !v.plan) req('plan', 'Оберіть тариф');
    if (customPlan) {
      const name = v.customPlanName.trim();
      if (!name) req('customPlanName', 'Вкажіть назву тарифу');
      else if (name.length > 60) req('customPlanName', 'Максимум 60 символів');
      const price = Number(v.customPrice.replace(',', '.'));
      if (!v.customPrice.trim()) req('customPrice', 'Вкажіть ціну');
      else if (!Number.isFinite(price) || price <= 0) req('customPrice', 'Ціна має бути більшою за 0');
      else if (price > 1_000_000) req('customPrice', 'Занадто велика сума');
    }

    if (!v.startDate) req('startDate', 'Вкажіть дату початку');
    else if (!isISODate(v.startDate)) req('startDate', 'Некоректна дата');

    if (v.hasTrial) {
      if (!v.trialEndDate) req('trialEndDate', 'Вкажіть дату кінця пробного періоду');
      else if (!isISODate(v.trialEndDate)) req('trialEndDate', 'Некоректна дата');
      else if (v.startDate && v.trialEndDate <= v.startDate) req('trialEndDate', 'Має бути після дати початку');
    }
  });

export type SubscriptionFormValues = z.input<typeof subscriptionFormSchema>;

export function emptyFormValues(defaultPaymentMethodId: number | null): SubscriptionFormValues {
  return {
    service: '',
    customServiceName: '',
    customCategoryId: '',
    plan: '',
    customPlanName: '',
    customPrice: '',
    customCurrency: 'UAH',
    customPeriod: 'month',
    paymentMethodId: defaultPaymentMethodId ? String(defaultPaymentMethodId) : '',
    startDate: todayISO(),
    hasTrial: false,
    trialEndDate: '',
    autoRenew: true,
  };
}

export function valuesFromSubscription(s: Subscription): SubscriptionFormValues {
  return {
    ...emptyFormValues(null),
    service: String(s.service.id),
    plan: String(s.plan.id),
    paymentMethodId: s.payment_method_id ? String(s.payment_method_id) : '',
    startDate: s.start_date,
    hasTrial: s.trial_end_date !== null,
    trialEndDate: s.trial_end_date ?? '',
    autoRenew: s.auto_renew,
  };
}

/** Поля API → поля форми (щоб помилки сервера з'являлися під потрібними полями). */
export const API_FIELD_TO_FORM: Record<string, keyof SubscriptionFormValues> = {
  plan_id: 'plan',
  service_id: 'service',
  payment_method_id: 'paymentMethodId',
  start_date: 'startDate',
  trial_end_date: 'trialEndDate',
  name: 'customServiceName',
  category_id: 'customCategoryId',
  price: 'customPrice',
  currency: 'customCurrency',
  billing_period: 'customPeriod',
};
