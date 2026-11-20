import { z } from 'zod';
import {
  billingPeriodSchema,
  currencySchema,
  paymentMethodTypeSchema,
  paymentStatusSchema,
  subscriptionStatusSchema,
  themeSchema,
} from '@shared/domain';

/** zod-схеми і типи відповідей API */

export type {
  PaymentMethodType,
  PaymentStatus,
  SubscriptionSort,
  SubscriptionStatus,
  Theme,
} from '@shared/domain';
export type { BillingPeriod, Currency } from '@shared/money';

export const healthSchema = z.object({
  status: z.literal('ok'),
  uptime: z.number(),
  timestamp: z.string(),
});

// ── Каталог ─────────────────────────────────────────────────

export const categorySchema = z.object({ id: z.number(), slug: z.string(), name: z.string() });

export const planSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  currency: currencySchema,
  billing_period: billingPeriodSchema,
  is_custom: z.boolean(),
});

export const catalogServiceSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  category: z.string(),
  name: z.string(),
  icon: z.string(),
  brand_color: z.string(),
  website: z.string(),
  is_custom: z.boolean(),
  plans: z.array(planSchema),
});

export const catalogSchema = z.object({
  categories: z.array(categorySchema),
  services: z.array(catalogServiceSchema),
});

export const createdServiceSchema = z.object({ id: z.number(), name: z.string(), category_id: z.number() });
export const createdPlanSchema = z.object({ id: z.number(), service_id: z.number(), name: z.string() });

export const ratesSchema = z.object({
  base: z.literal('UAH'),
  rates: z.object({ UAH: z.number(), USD: z.number(), EUR: z.number() }),
  /** Дата курсу НБУ (YYYY-MM-DD). */
  rate_date: z.string().nullable(),
  /** Коли сервер отримав курс (ISO 8601). */
  updated_at: z.string().nullable(),
  /** 'nbu' — курс НБУ; 'seed' — резервний, якщо НБУ ще не був доступний. */
  source: z.enum(['nbu', 'seed']),
});

// ── Підписки ────────────────────────────────────────────────

const serviceRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string(),
  brand_color: z.string(),
  category: z.string(),
  category_id: z.number(),
});

export const subscriptionSchema = z.object({
  id: z.number(),
  status: subscriptionStatusSchema,
  start_date: z.string(),
  trial_end_date: z.string().nullable(),
  next_payment_date: z.string().nullable(),
  auto_renew: z.boolean(),
  plan: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    currency: currencySchema,
    billing_period: billingPeriodSchema,
  }),
  service: serviceRefSchema,
  payment_method_id: z.number().nullable(),
  payment_method: z.string().nullable(),
  converted_price: z.number(),
  monthly_amount: z.number(),
  display_currency: currencySchema,
});

const statusCountsSchema = z.object({
  all: z.number(),
  trial: z.number(),
  active: z.number(),
  paused: z.number(),
  cancelled: z.number(),
  expired: z.number(),
});

export const subscriptionListSchema = z.object({
  items: z.array(subscriptionSchema),
  counts: statusCountsSchema,
  currency: currencySchema,
});

// ── Платежі ─────────────────────────────────────────────────

const paymentServiceSchema = z.object({ name: z.string(), icon: z.string(), brand_color: z.string() });

export const calendarItemSchema = z.object({
  key: z.string(),
  kind: z.enum(['paid', 'expected']),
  date: z.string(),
  subscription_id: z.number().nullable(),
  service: paymentServiceSchema,
  plan_name: z.string(),
  billing_period: billingPeriodSchema,
  amount: z.number(),
  currency: currencySchema,
  converted_amount: z.number(),
  payment_method: z.string().nullable(),
  payment_status: paymentStatusSchema.nullable(),
  overdue: z.boolean(),
  trial_end: z.boolean(),
  payable: z.boolean(),
});

export const calendarSchema = z.object({
  month: z.string(),
  currency: currencySchema,
  items: z.array(calendarItemSchema),
  summary: z.object({ paid: z.number(), expected: z.number() }),
});

export const paymentSchema = z.object({
  id: z.number(),
  subscription_id: z.number().nullable(),
  date: z.string(),
  paid_at: z.string(),
  status: paymentStatusSchema,
  amount: z.number(),
  currency: currencySchema,
  converted_amount: z.number(),
  service: paymentServiceSchema,
  plan_name: z.string(),
  billing_period: billingPeriodSchema,
  payment_method: z.string().nullable(),
});

export const paymentHistorySchema = z.object({
  items: z.array(paymentSchema),
  total: z.number(),
  currency: currencySchema,
});

export const payResultSchema = z.object({ payment: paymentSchema, subscription: subscriptionSchema });

// ── Дашборд ─────────────────────────────────────────────────

export const dashboardSchema = z.object({
  currency: currencySchema,
  active_count: z.number(),
  trial_count: z.number(),
  paused_count: z.number(),
  monthly_total: z.number(),
  yearly_forecast: z.number(),
  month: z.string(),
  month_paid: z.number(),
  month_expected: z.number(),
  next_payment: calendarItemSchema.extend({ days_until: z.number() }).nullable(),
  chart: z.array(z.object({ month: z.string(), amount: z.number(), kind: z.enum(['actual', 'current', 'forecast']) })),
  upcoming: z.array(subscriptionSchema),
});

// ── Налаштування ────────────────────────────────────────────

export const paymentMethodSchema = z.object({
  id: z.number(),
  type: paymentMethodTypeSchema,
  label: z.string(),
  details: z.string(),
  is_default: z.boolean(),
});
export const paymentMethodListSchema = z.object({ items: z.array(paymentMethodSchema) });

export const settingsResponseSchema = z.object({
  currency: currencySchema,
  theme: themeSchema,
  remind_7: z.boolean(),
  remind_3: z.boolean(),
  remind_1: z.boolean(),
  remind_hour: z.number(),
  telegram: z.object({
    /** Бот налаштований на сервері (TELEGRAM_BOT_TOKEN і TELEGRAM_BOT_NAME). */
    configured: z.boolean(),
    bot_name: z.string().nullable(),
    linked: z.boolean(),
    username: z.string().nullable(),
    linked_at: z.string().nullable(),
  }),
});

export const telegramLinkSchema = z.object({ url: z.string(), expires_at: z.string(), settings: settingsResponseSchema });
export const telegramSettingsSchema = z.object({ settings: settingsResponseSchema });
export const telegramTestSchema = z.object({ ok: z.boolean(), message: z.string() });

// ── Типи ────────────────────────────────────────────────────

export type Health = z.infer<typeof healthSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Plan = z.infer<typeof planSchema>;
export type CatalogService = z.infer<typeof catalogServiceSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type Rates = z.infer<typeof ratesSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type SubscriptionList = z.infer<typeof subscriptionListSchema>;
export type StatusCounts = z.infer<typeof statusCountsSchema>;
export type CalendarItem = z.infer<typeof calendarItemSchema>;
export type CalendarData = z.infer<typeof calendarSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type PaymentHistory = z.infer<typeof paymentHistorySchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type NextPaymentInfo = NonNullable<Dashboard['next_payment']>;
export type ChartPoint = Dashboard['chart'][number];
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Settings = z.infer<typeof settingsResponseSchema>;
