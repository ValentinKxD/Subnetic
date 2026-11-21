import type { Role } from '../../shared/auth.js';
import type { PaymentMethodType, PaymentStatus, SubscriptionStatus, Theme } from '../../shared/domain.js';
import type { BillingPeriod, Currency, Rates } from '../../shared/money.js';

export type { BillingPeriod, Currency, PaymentMethodType, PaymentStatus, Rates, Role, SubscriptionStatus, Theme };

// ── Сутності (як їх повертає шар db, булеві поля вже перетворені з 0/1) ──

export interface Category {
  id: number;
  slug: string;
  name: string;
}

export interface Service {
  id: number;
  category_id: number;
  /** null — глобальний каталог; id користувача — власний сервіс. */
  owner_user_id: number | null;
  name: string;
  icon: string | null;
  brand_color: string;
  website: string | null;
}

export interface Plan {
  id: number;
  service_id: number;
  /** null — глобальний тариф; id користувача — власний. */
  user_id: number | null;
  name: string;
  price: number;
  currency: Currency;
  billing_period: BillingPeriod;
}

export interface User {
  id: number;
  nickname: string;
  email: string;
  phone: string | null;
  password_hash: string;
  telegram_chat_id: number | null;
  telegram_username: string | null;
  telegram_linked_at: string | null;
  created_at: string;
  role: Role;
  /** Час блокування адміністратором; null — активний. */
  blocked_at: string | null;
}

export interface Settings {
  user_id: number;
  currency: Currency;
  theme: Theme;
  remind_7: boolean;
  remind_3: boolean;
  remind_1: boolean;
  remind_hour: number;
}

export interface PaymentMethod {
  id: number;
  user_id: number;
  type: PaymentMethodType;
  /** Колонка title. */
  label: string;
  details: string;
  is_default: boolean;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  payment_method_id: number | null;
  status: SubscriptionStatus;
  start_date: string;
  trial_end_date: string | null;
  next_payment_date: string | null;
  auto_renew: boolean;
  cancelled_at: string | null;
  note: string | null;
}

/** Підписка разом із тарифом, сервісом, категорією та назвою способу оплати (один JOIN). */
export interface SubscriptionDetails extends Subscription {
  plan: Plan;
  service: Service;
  category_name: string;
  payment_method_label: string | null;
}

/** Платіж із назвами сервісу/тарифу (через підписку). */
export interface PaymentDetails {
  id: number;
  subscription_id: number;
  amount: number;
  currency: Currency;
  due_date: string;
  status: PaymentStatus;
  paid_at: string;
  service_name: string;
  service_icon: string | null;
  brand_color: string;
  plan_name: string;
  billing_period: BillingPeriod;
  payment_method_label: string | null;
}

/** Що потрібно сервісам про поточного користувача: валюта відображення і курси. */
export interface UserContext {
  userId: number;
  currency: Currency;
  rates: Rates;
}

// ── Відповіді API (формати, які очікує клієнт) ──────────────

export interface ServiceRef {
  id: number;
  name: string;
  icon: string;
  brand_color: string;
  category: string;
  category_id: number;
}

export interface SubscriptionDTO {
  id: number;
  status: SubscriptionStatus;
  start_date: string;
  trial_end_date: string | null;
  next_payment_date: string | null;
  auto_renew: boolean;
  plan: { id: number; name: string; price: number; currency: Currency; billing_period: BillingPeriod };
  service: ServiceRef;
  payment_method_id: number | null;
  payment_method: string | null;
  /** Ціна за період у валюті користувача. */
  converted_price: number;
  /** Місячний еквівалент у валюті користувача. */
  monthly_amount: number;
  display_currency: Currency;
}

export interface CatalogPlanDTO {
  id: number;
  name: string;
  price: number;
  currency: Currency;
  billing_period: BillingPeriod;
  is_custom: boolean;
}

export interface CatalogServiceDTO {
  id: number;
  category_id: number;
  category: string;
  name: string;
  icon: string;
  brand_color: string;
  website: string;
  is_custom: boolean;
  plans: CatalogPlanDTO[];
}

export interface CatalogDTO {
  categories: Category[];
  services: CatalogServiceDTO[];
}

export type CalendarItemKind = 'paid' | 'expected';

export interface CalendarItem {
  /** Стабільний ключ: `p-<paymentId>` для минулих, `s-<subId>-<date>` для обчислених. */
  key: string;
  kind: CalendarItemKind;
  date: string;
  subscription_id: number | null;
  service: { name: string; icon: string; brand_color: string };
  plan_name: string;
  billing_period: BillingPeriod;
  amount: number;
  currency: Currency;
  converted_amount: number;
  payment_method: string | null;
  /** Для минулих: статус платежу. */
  payment_status: PaymentStatus | null;
  /** Очікуваний платіж, дата якого вже минула (не позначений оплаченим). */
  overdue: boolean;
  /** Перше списання після пробного періоду. */
  trial_end: boolean;
  /** Чи можна позначити оплаченим (лише найближчий очікуваний платіж підписки). */
  payable: boolean;
}

export interface PaymentDTO {
  id: number;
  subscription_id: number | null;
  date: string;
  paid_at: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  converted_amount: number;
  service: { name: string; icon: string; brand_color: string };
  plan_name: string;
  billing_period: BillingPeriod;
  payment_method: string | null;
}

export interface PaymentMethodDTO {
  id: number;
  type: PaymentMethodType;
  label: string;
  details: string;
  is_default: boolean;
}

export interface SettingsDTO {
  currency: Currency;
  theme: Theme;
  remind_7: boolean;
  remind_3: boolean;
  remind_1: boolean;
  remind_hour: number;
  telegram: {
    /** Чи задано на сервері TELEGRAM_BOT_TOKEN і TELEGRAM_BOT_NAME. */
    configured: boolean;
    /** Ім'я бота (без @) для показу; null, якщо бот не налаштований. */
    bot_name: string | null;
    /** Прив'язано, якщо бот записав telegram_chat_id. */
    linked: boolean;
    username: string | null;
    linked_at: string | null;
  };
}
