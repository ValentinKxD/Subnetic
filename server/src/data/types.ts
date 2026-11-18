import type { PaymentMethodType, PaymentStatus, SubscriptionStatus, Theme } from '../../../shared/domain.js';
import type { BillingPeriod, Currency } from '../../../shared/money.js';

export type { BillingPeriod, Currency, PaymentMethodType, PaymentStatus, SubscriptionStatus, Theme };

// ── Збережені сутності (in-memory «таблиці») ────────────────

export interface Category {
  id: number;
  slug: string;
  name: string;
}

export interface Service {
  id: number;
  category_id: number;
  name: string;
  /** Шлях до іконки в client/public/icons, напр. "/icons/netflix.svg"; '' — без іконки. */
  icon: string;
  brand_color: string;
  website: string;
  /** null — глобальний каталог; id користувача — власний сервіс. */
  owner_id: number | null;
}

export interface Plan {
  id: number;
  service_id: number;
  name: string;
  price: number;
  currency: Currency;
  billing_period: BillingPeriod;
  owner_id: number | null;
}

export interface User {
  id: number;
  nickname: string;
  email: string;
  phone: string | null;
  /** ЗАГЛУШКА: пароль зберігається відкритим текстом. На реальному бекенді — SHA-256-хеш. */
  password: string;
  created_at: string;
}

export interface PaymentMethod {
  id: number;
  user_id: number;
  type: PaymentMethodType;
  label: string;
  details: string;
  is_default: boolean;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: SubscriptionStatus;
  start_date: string;
  trial_end_date: string | null;
  next_payment_date: string | null;
  auto_renew: boolean;
  payment_method_id: number | null;
  created_at: string;
}

/** Здійснений платіж. Назви знімаються в момент оплати, щоб історія пережила видалення підписки. */
export interface Payment {
  id: number;
  user_id: number;
  subscription_id: number | null;
  amount: number;
  currency: Currency;
  /** Дата, за яку платіж (дата списання за графіком). */
  due_date: string;
  /** Коли позначено оплаченим. */
  paid_at: string;
  status: PaymentStatus;
  service_name: string;
  service_icon: string;
  brand_color: string;
  plan_name: string;
  billing_period: BillingPeriod;
  payment_method: string | null;
}

export interface Settings {
  user_id: number;
  currency: Currency;
  theme: Theme;
  remind_7: boolean;
  remind_3: boolean;
  remind_1: boolean;
  remind_hour: number;
  telegram_username: string | null;
  telegram_linked_at: string | null;
}

// ── Відповіді API ───────────────────────────────────────────

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
  plan: {
    id: number;
    name: string;
    price: number;
    currency: Currency;
    billing_period: BillingPeriod;
  };
  service: ServiceRef;
  payment_method_id: number | null;
  payment_method: string | null;
  /** Ціна за період у валюті користувача. */
  converted_price: number;
  /** Місячний еквівалент у валюті користувача. */
  monthly_amount: number;
  display_currency: Currency;
}

export interface CatalogDTO {
  categories: Category[];
  services: Array<
    Omit<Service, 'owner_id'> & {
      category: string;
      is_custom: boolean;
      plans: Array<Omit<Plan, 'service_id' | 'owner_id'> & { is_custom: boolean }>;
    }
  >;
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

export interface SettingsDTO {
  currency: Currency;
  theme: Theme;
  remind_7: boolean;
  remind_3: boolean;
  remind_1: boolean;
  remind_hour: number;
  telegram: { linked: boolean; username: string | null; linked_at: string | null };
}
