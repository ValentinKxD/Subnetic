import { z } from 'zod';
import {
  authResponseSchema,
  meResponseSchema,
  publicUserSchema,
  type AuthResponse,
  type LoginData,
  type ProfileData,
  type PublicUser,
  type RegisterData,
} from '@shared/auth';
import type {
  AdminCategoryInput,
  AdminPlanInput,
  AdminServiceInput,
  AdminServicePatch,
  AdminUserPatch,
} from '@shared/admin';
import type {
  CustomPlanInput,
  CustomServiceInput,
  PaymentHistoryQuery,
  PaymentMethodInput,
  SettingsPatch,
  SubscriptionCreateInput,
  SubscriptionQuery,
  SubscriptionUpdateInput,
} from '@shared/domain';
import {
  adminCategoryListSchema,
  adminCategorySchema,
  adminCustomServiceListSchema,
  adminRatesRefreshSchema,
  adminServiceListSchema,
  adminServiceSchema,
  adminStatsSchema,
  adminSystemSchema,
  adminUserListSchema,
  adminUserSchema,
  calendarSchema,
  catalogSchema,
  createdPlanSchema,
  createdServiceSchema,
  dashboardSchema,
  healthSchema,
  payResultSchema,
  paymentHistorySchema,
  paymentMethodListSchema,
  paymentMethodSchema,
  ratesSchema,
  settingsResponseSchema,
  subscriptionListSchema,
  subscriptionSchema,
  telegramLinkSchema,
  telegramSettingsSchema,
  telegramTestSchema,
} from '@/lib/types';
import { api } from './client';

/** Рядок запиту з непорожніх параметрів. */
type QueryParams = Record<string, string | number | undefined | null>;

function qs(params: QueryParams): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const getHealth = (signal?: AbortSignal) => api.get('/health', { schema: healthSchema, signal });

// ── Автентифікація ──────────────────────────────────────────

export async function fetchMe(signal?: AbortSignal): Promise<PublicUser> {
  const res = await api.get('/auth/me', { schema: meResponseSchema, signal, skipAuthRedirect: true });
  return res.user;
}

export const login = (data: LoginData): Promise<AuthResponse> =>
  api.post('/auth/login', data, { schema: authResponseSchema, skipAuthRedirect: true });

export const register = (data: RegisterData): Promise<AuthResponse> =>
  api.post('/auth/register', data, { schema: authResponseSchema, skipAuthRedirect: true });

export async function logout(): Promise<void> {
  await api.post('/auth/logout', undefined, { skipAuthRedirect: true });
}

// ── Каталог і курси ─────────────────────────────────────────

export const getCatalog = (signal?: AbortSignal) => api.get('/catalog', { schema: catalogSchema, signal });
export const createCustomService = (data: CustomServiceInput) =>
  api.post('/catalog/services', data, { schema: createdServiceSchema });
export const createCustomPlan = (data: CustomPlanInput) => api.post('/catalog/plans', data, { schema: createdPlanSchema });
export const getRates = (signal?: AbortSignal) => api.get('/rates', { schema: ratesSchema, signal });

// ── Дашборд ─────────────────────────────────────────────────

export const getDashboard = (signal?: AbortSignal) => api.get('/dashboard', { schema: dashboardSchema, signal });

// ── Підписки ────────────────────────────────────────────────

export const getSubscriptions = (query: SubscriptionQuery, signal?: AbortSignal) =>
  api.get(`/subscriptions${qs(query)}`, { schema: subscriptionListSchema, signal });
export const createSubscription = (data: SubscriptionCreateInput) =>
  api.post('/subscriptions', data, { schema: subscriptionSchema });
export const updateSubscription = (id: number, data: SubscriptionUpdateInput) =>
  api.patch(`/subscriptions/${id}`, data, { schema: subscriptionSchema });
export const deleteSubscription = (id: number) => api.delete<void>(`/subscriptions/${id}`);
export const paySubscription = (id: number) => api.post(`/subscriptions/${id}/pay`, undefined, { schema: payResultSchema });

// ── Платежі ─────────────────────────────────────────────────

export const getCalendar = (month: string, signal?: AbortSignal) =>
  api.get(`/payments/calendar${qs({ month })}`, { schema: calendarSchema, signal });
export const getPaymentHistory = (query: PaymentHistoryQuery, signal?: AbortSignal) =>
  api.get(`/payments${qs(query)}`, { schema: paymentHistorySchema, signal });

// ── Способи оплати ──────────────────────────────────────────

export const getPaymentMethods = (signal?: AbortSignal) =>
  api.get('/payment-methods', { schema: paymentMethodListSchema, signal });
export const createPaymentMethod = (data: PaymentMethodInput) =>
  api.post('/payment-methods', data, { schema: paymentMethodSchema });
export const updatePaymentMethod = (id: number, data: Partial<PaymentMethodInput>) =>
  api.patch(`/payment-methods/${id}`, data, { schema: paymentMethodSchema });
export const deletePaymentMethod = (id: number) => api.delete<void>(`/payment-methods/${id}`);

// ── Налаштування, профіль, Telegram ─────────────────────────

export const getSettings = (signal?: AbortSignal) => api.get('/settings', { schema: settingsResponseSchema, signal });
export const patchSettings = (data: SettingsPatch) => api.patch('/settings', data, { schema: settingsResponseSchema });

export async function patchProfile(data: ProfileData): Promise<PublicUser> {
  const res = await api.patch('/profile', data, { schema: z.object({ user: publicUserSchema }) });
  return res.user;
}

export const linkTelegram = () => api.post('/telegram/link', undefined, { schema: telegramLinkSchema });
export const unlinkTelegram = () => api.post('/telegram/unlink', undefined, { schema: telegramSettingsSchema });
export const testTelegram = () => api.post('/telegram/test', undefined, { schema: telegramTestSchema });
export const sendReminderNow = () => api.post('/telegram/remind-now', undefined, { schema: telegramTestSchema });

// ── Адмін-панель ────────────────────────────────────────────

export const admin = {
  stats: (signal?: AbortSignal) => api.get('/admin/stats', { schema: adminStatsSchema, signal }),
  system: (signal?: AbortSignal) => api.get('/admin/system', { schema: adminSystemSchema, signal }),
  refreshRates: () => api.post('/admin/rates/refresh', undefined, { schema: adminRatesRefreshSchema }),

  users: (query: QueryParams, signal?: AbortSignal) =>
    api.get(`/admin/users${qs(query)}`, { schema: adminUserListSchema, signal }),
  updateUser: (id: number, data: AdminUserPatch) => api.patch(`/admin/users/${id}`, data, { schema: adminUserSchema }),
  unlinkUserTelegram: (id: number) =>
    api.post(`/admin/users/${id}/unlink-telegram`, undefined, { schema: adminUserSchema }),
  deleteUser: (id: number) => api.delete<void>(`/admin/users/${id}`),

  categories: (signal?: AbortSignal) => api.get('/admin/categories', { schema: adminCategoryListSchema, signal }),
  createCategory: (data: AdminCategoryInput) => api.post('/admin/categories', data, { schema: adminCategorySchema }),
  updateCategory: (id: number, data: Partial<AdminCategoryInput>) =>
    api.patch(`/admin/categories/${id}`, data, { schema: adminCategorySchema }),
  deleteCategory: (id: number) => api.delete<void>(`/admin/categories/${id}`),

  services: (query: QueryParams, signal?: AbortSignal) =>
    api.get(`/admin/services${qs(query)}`, { schema: adminServiceListSchema, signal }),
  createService: (data: AdminServiceInput) => api.post('/admin/services', data, { schema: adminServiceSchema }),
  updateService: (id: number, data: AdminServicePatch) =>
    api.patch(`/admin/services/${id}`, data, { schema: adminServiceSchema }),
  deleteService: (id: number) => api.delete<void>(`/admin/services/${id}`),
  createPlan: (serviceId: number, data: AdminPlanInput) =>
    api.post(`/admin/services/${serviceId}/plans`, data, { schema: adminServiceSchema }),
  updatePlan: (id: number, data: Partial<AdminPlanInput>) =>
    api.patch(`/admin/plans/${id}`, data, { schema: adminServiceSchema }),
  deletePlan: (id: number) => api.delete(`/admin/plans/${id}`, { schema: adminServiceSchema }),

  customServices: (signal?: AbortSignal) =>
    api.get('/admin/custom-services', { schema: adminCustomServiceListSchema, signal }),
};
