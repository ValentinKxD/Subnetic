import { z } from 'zod';
import { isISODate } from './dates.js';
import { BILLING_PERIODS, CURRENCIES } from './money.js';

/** Спільні zod-схеми тіл запитів API */

export const currencySchema = z.enum(CURRENCIES);
export const billingPeriodSchema = z.enum(BILLING_PERIODS);
export const SUBSCRIPTION_STATUSES = ['trial', 'active', 'paused', 'cancelled', 'expired'] as const;
export const subscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUSES);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const PAYMENT_STATUSES = ['paid', 'failed', 'refunded'] as const;
export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const PAYMENT_METHOD_TYPES = ['card', 'paypal', 'apple_pay', 'google_pay', 'other'] as const;
export const paymentMethodTypeSchema = z.enum(PAYMENT_METHOD_TYPES);
export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>;

export const THEMES = ['light', 'dark'] as const;
export const themeSchema = z.enum(THEMES);
export type Theme = z.infer<typeof themeSchema>;

export const SUBSCRIPTION_SORTS = ['next_payment', 'name', 'price_desc', 'price_asc'] as const;
export const subscriptionSortSchema = z.enum(SUBSCRIPTION_SORTS);
export type SubscriptionSort = z.infer<typeof subscriptionSortSchema>;

export const isoDateSchema = z
  .string()
  .min(1, 'Вкажіть дату')
  .refine(isISODate, 'Некоректна дата');

const idSchema = z
  .number({ required_error: 'Оберіть значення', invalid_type_error: 'Оберіть значення' })
  .int('Оберіть значення')
  .positive('Оберіть значення');

// ── Каталог: власні сервіси й тарифи ───────────────────────

export const customServiceSchema = z.object({
  name: z.string().trim().min(1, 'Вкажіть назву сервісу').max(60, 'Максимум 60 символів'),
  category_id: idSchema,
});
export type CustomServiceInput = z.infer<typeof customServiceSchema>;

export const priceSchema = z
  .number({ invalid_type_error: 'Вкажіть ціну' })
  .positive('Ціна має бути більшою за 0')
  .max(1_000_000, 'Занадто велика сума');

export const customPlanSchema = z.object({
  service_id: idSchema,
  name: z.string().trim().min(1, 'Вкажіть назву тарифу').max(60, 'Максимум 60 символів'),
  price: priceSchema,
  currency: currencySchema,
  billing_period: billingPeriodSchema,
});
export type CustomPlanInput = z.infer<typeof customPlanSchema>;

// ── Підписки ────────────────────────────────────────────────

export const subscriptionCreateSchema = z
  .object({
    plan_id: idSchema,
    payment_method_id: idSchema.nullable(),
    start_date: isoDateSchema,
    /** Кінець пробного періоду; null — без пробного. */
    trial_end_date: isoDateSchema.nullable(),
    auto_renew: z.boolean(),
  })
  .refine((d) => d.trial_end_date === null || d.trial_end_date > d.start_date, {
    path: ['trial_end_date'],
    message: 'Кінець пробного періоду має бути після дати початку',
  });
export type SubscriptionCreateInput = z.infer<typeof subscriptionCreateSchema>;

export const subscriptionUpdateSchema = z
  .object({
    plan_id: idSchema,
    payment_method_id: idSchema.nullable(),
    start_date: isoDateSchema,
    trial_end_date: isoDateSchema.nullable(),
    next_payment_date: isoDateSchema.nullable(),
    auto_renew: z.boolean(),
    status: subscriptionStatusSchema,
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Немає змін');
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;

export const subscriptionQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: subscriptionStatusSchema.optional(),
  category: z.coerce.number().int().positive().optional(),
  sort: subscriptionSortSchema.default('next_payment'),
});
export type SubscriptionQuery = z.input<typeof subscriptionQuerySchema>;

// ── Платежі ─────────────────────────────────────────────────

export const paymentHistoryQuerySchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  status: paymentStatusSchema.optional(),
  subscription_id: z.coerce.number().int().positive().optional(),
  q: z.string().trim().max(100).optional(),
});
export type PaymentHistoryQuery = z.input<typeof paymentHistoryQuerySchema>;

// ── Способи оплати ──────────────────────────────────────────

export const paymentMethodInputSchema = z.object({
  type: paymentMethodTypeSchema,
  label: z.string().trim().min(1, 'Вкажіть назву').max(40, 'Максимум 40 символів'),
  details: z.string().trim().max(60, 'Максимум 60 символів').default(''),
  is_default: z.boolean().default(false),
});
export type PaymentMethodInput = z.input<typeof paymentMethodInputSchema>;

// ── Налаштування і профіль ──────────────────────────────────

export const settingsSchema = z.object({
  currency: currencySchema,
  theme: themeSchema,
  remind_7: z.boolean(),
  remind_3: z.boolean(),
  remind_1: z.boolean(),
  remind_hour: z.number().int().min(0, 'Година від 0 до 23').max(23, 'Година від 0 до 23'),
});
export type SettingsValues = z.infer<typeof settingsSchema>;

export const settingsPatchSchema = settingsSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Немає змін');
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
