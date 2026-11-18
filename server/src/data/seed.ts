import { addDays, addPeriod, todayISO } from '../../../shared/dates.js';
import type { Category, PaymentMethod, Plan, Service, Settings, Subscription, User } from './types.js';

// Тимчасові тестові дані (пізніше — SQLite).
// Дати підписок рахуються від сьогодні, щоб демо завжди мало найближчі платежі й історію.

const today = todayISO();
const rel = (days: number) => addDays(today, days);

export const categories: Category[] = [
  { id: 1, slug: 'streaming', name: 'Стримінг' },
  { id: 2, slug: 'cloud', name: 'Хмара' },
  { id: 3, slug: 'games', name: 'Ігри' },
  { id: 4, slug: 'education', name: 'Навчання' },
  { id: 5, slug: 'music', name: 'Музика' },
  { id: 6, slug: 'other', name: 'Інше' },
];

type SeedService = Omit<Service, 'owner_id'>;
const globalServices: SeedService[] = [
  { id: 1, category_id: 1, name: 'Netflix', icon: '/icons/netflix.svg', brand_color: '#E50914', website: 'https://www.netflix.com' },
  { id: 2, category_id: 5, name: 'Spotify', icon: '/icons/spotify.svg', brand_color: '#1DB954', website: 'https://www.spotify.com' },
  { id: 3, category_id: 1, name: 'YouTube Premium', icon: '/icons/youtube-premium.svg', brand_color: '#FF0000', website: 'https://www.youtube.com/premium' },
  { id: 4, category_id: 3, name: 'Xbox Game Pass', icon: '/icons/xbox-game-pass.svg', brand_color: '#107C10', website: 'https://www.xbox.com/game-pass' },
  { id: 5, category_id: 3, name: 'PS Plus', icon: '/icons/ps-plus.svg', brand_color: '#0070D1', website: 'https://www.playstation.com/ps-plus' },
  { id: 6, category_id: 4, name: 'Coursera', icon: '/icons/coursera.svg', brand_color: '#0056D2', website: 'https://www.coursera.org' },
  { id: 7, category_id: 2, name: 'Google One', icon: '/icons/google-one.svg', brand_color: '#4285F4', website: 'https://one.google.com' },
  { id: 8, category_id: 2, name: 'iCloud+', icon: '/icons/icloud-plus.svg', brand_color: '#3693F3', website: 'https://www.icloud.com' },
  { id: 9, category_id: 2, name: 'Dropbox', icon: '/icons/dropbox.svg', brand_color: '#0061FF', website: 'https://www.dropbox.com' },
  { id: 10, category_id: 4, name: 'Duolingo', icon: '/icons/duolingo.svg', brand_color: '#58CC02', website: 'https://www.duolingo.com' },
];
export const services: Service[] = globalServices.map((s) => ({ ...s, owner_id: null }));

type SeedPlan = Omit<Plan, 'owner_id'>;
const globalPlans: SeedPlan[] = [
  { id: 1, service_id: 1, name: 'Базовий', price: 199, currency: 'UAH', billing_period: 'month' },
  { id: 2, service_id: 1, name: 'Стандартний', price: 299, currency: 'UAH', billing_period: 'month' },
  { id: 3, service_id: 1, name: 'Преміум', price: 399, currency: 'UAH', billing_period: 'month' },
  { id: 4, service_id: 2, name: 'Individual', price: 179, currency: 'UAH', billing_period: 'month' },
  { id: 5, service_id: 2, name: 'Duo', price: 239, currency: 'UAH', billing_period: 'month' },
  { id: 6, service_id: 2, name: 'Family', price: 289, currency: 'UAH', billing_period: 'month' },
  { id: 7, service_id: 3, name: 'Індивідуальний', price: 149, currency: 'UAH', billing_period: 'month' },
  { id: 8, service_id: 3, name: 'Сімейний', price: 279, currency: 'UAH', billing_period: 'month' },
  { id: 9, service_id: 4, name: 'Core', price: 6.99, currency: 'USD', billing_period: 'month' },
  { id: 10, service_id: 4, name: 'Ultimate', price: 19.99, currency: 'USD', billing_period: 'month' },
  { id: 11, service_id: 5, name: 'Essential', price: 1250, currency: 'UAH', billing_period: 'year' },
  { id: 12, service_id: 5, name: 'Extra', price: 920, currency: 'UAH', billing_period: 'quarter' },
  { id: 13, service_id: 6, name: 'Coursera Plus', price: 59, currency: 'USD', billing_period: 'month' },
  { id: 14, service_id: 6, name: 'Coursera Plus (рік)', price: 399, currency: 'USD', billing_period: 'year' },
  { id: 15, service_id: 7, name: '100 ГБ', price: 1.99, currency: 'USD', billing_period: 'month' },
  { id: 16, service_id: 7, name: '2 ТБ', price: 9.99, currency: 'USD', billing_period: 'month' },
  { id: 17, service_id: 8, name: '50 ГБ', price: 0.99, currency: 'USD', billing_period: 'month' },
  { id: 18, service_id: 8, name: '200 ГБ', price: 2.99, currency: 'USD', billing_period: 'month' },
  { id: 19, service_id: 9, name: 'Plus', price: 11.99, currency: 'EUR', billing_period: 'month' },
  { id: 20, service_id: 9, name: 'Essentials', price: 19.99, currency: 'EUR', billing_period: 'month' },
  { id: 21, service_id: 10, name: 'Super', price: 3.49, currency: 'USD', billing_period: 'week' },
  { id: 22, service_id: 10, name: 'Super (рік)', price: 59.99, currency: 'USD', billing_period: 'year' },
];
export const plans: Plan[] = globalPlans.map((p) => ({ ...p, owner_id: null }));

// Демо-вхід: demo / demo@subnetic.local, пароль demo12345
export const users: User[] = [
  {
    id: 1,
    nickname: 'demo',
    email: 'demo@subnetic.local',
    phone: null,
    password: 'demo12345',
    created_at: '2024-09-01T10:00:00.000Z',
  },
];

export const paymentMethods: PaymentMethod[] = [
  { id: 1, user_id: 1, type: 'card', label: 'Visa ·4242', details: 'Картка · діє до 08/28', is_default: true },
  { id: 2, user_id: 1, type: 'card', label: 'Mastercard ·5100', details: 'Картка · діє до 03/27', is_default: false },
  { id: 3, user_id: 1, type: 'paypal', label: 'PayPal', details: 'demo@subnetic.local', is_default: false },
  { id: 4, user_id: 1, type: 'google_pay', label: 'Google Pay', details: '', is_default: false },
];

export const settings: Settings[] = [
  {
    user_id: 1,
    currency: 'UAH',
    theme: 'light',
    remind_7: true,
    remind_3: true,
    remind_1: true,
    remind_hour: 9,
    telegram_username: null,
    telegram_linked_at: null,
  },
];

/** Підписка + до якої дати (не включно) згенерувати історію сплачених платежів. */
export interface SeedSubscription extends Subscription {
  history_until: string | null;
}

/** Дата початку, з якої до `next` рівно `n` періодів. */
const back = (next: string, period: Plan['billing_period'], n: number) => addPeriod(next, period, -n);

const created = '2024-09-01T10:00:00.000Z';
export const subscriptions: SeedSubscription[] = [
  // Netflix Стандартний — найближчий платіж через 3 дні
  { id: 1, user_id: 1, plan_id: 2, status: 'active', start_date: back(rel(3), 'month', 20), trial_end_date: null, next_payment_date: rel(3), auto_renew: true, payment_method_id: 1, created_at: created, history_until: rel(3) },
  // Spotify Duo
  { id: 2, user_id: 1, plan_id: 5, status: 'active', start_date: back(rel(6), 'month', 26), trial_end_date: null, next_payment_date: rel(6), auto_renew: true, payment_method_id: 2, created_at: created, history_until: rel(6) },
  // YouTube Premium — пробний період
  { id: 3, user_id: 1, plan_id: 7, status: 'trial', start_date: rel(-13), trial_end_date: rel(17), next_payment_date: rel(17), auto_renew: true, payment_method_id: 1, created_at: created, history_until: null },
  // Xbox Game Pass Ultimate (USD) — на паузі
  { id: 4, user_id: 1, plan_id: 10, status: 'paused', start_date: rel(-420), trial_end_date: null, next_payment_date: null, auto_renew: false, payment_method_id: 3, created_at: created, history_until: rel(-50) },
  // Google One 2 ТБ (USD)
  { id: 5, user_id: 1, plan_id: 16, status: 'active', start_date: back(rel(27), 'month', 22), trial_end_date: null, next_payment_date: rel(27), auto_renew: true, payment_method_id: 4, created_at: created, history_until: rel(27) },
  // iCloud+ 200 ГБ (USD)
  { id: 6, user_id: 1, plan_id: 18, status: 'active', start_date: back(rel(10), 'month', 24), trial_end_date: null, next_payment_date: rel(10), auto_renew: true, payment_method_id: 1, created_at: created, history_until: rel(10) },
  // Coursera Plus (USD) — скасована
  { id: 7, user_id: 1, plan_id: 13, status: 'cancelled', start_date: rel(-290), trial_end_date: null, next_payment_date: null, auto_renew: false, payment_method_id: 1, created_at: created, history_until: rel(-200) },
  // PS Plus Extra — щокварталу
  { id: 8, user_id: 1, plan_id: 12, status: 'active', start_date: back(rel(40), 'quarter', 5), trial_end_date: null, next_payment_date: rel(40), auto_renew: true, payment_method_id: 2, created_at: created, history_until: rel(40) },
  // Dropbox Plus (EUR)
  { id: 9, user_id: 1, plan_id: 19, status: 'active', start_date: back(rel(14), 'month', 8), trial_end_date: null, next_payment_date: rel(14), auto_renew: true, payment_method_id: 1, created_at: created, history_until: rel(14) },
  // Duolingo Super — щотижня (USD)
  { id: 10, user_id: 1, plan_id: 21, status: 'active', start_date: back(rel(2), 'week', 16), trial_end_date: null, next_payment_date: rel(2), auto_renew: true, payment_method_id: 4, created_at: created, history_until: rel(2) },
  // Coursera Plus (рік) — завершилася
  { id: 11, user_id: 1, plan_id: 14, status: 'expired', start_date: rel(-430), trial_end_date: null, next_payment_date: null, auto_renew: false, payment_method_id: 2, created_at: created, history_until: rel(-429) },
];
