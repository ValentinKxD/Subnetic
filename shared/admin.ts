import { z } from 'zod';
import { roleSchema } from './auth.js';
import { billingPeriodSchema, currencySchema } from './domain.js';

/** Схеми запитів адмін-панелі (/api/admin) */

export const ADMIN_PAGE_SIZE = 20;

const pageSchema = z.coerce.number().int().min(1).default(1);
/** Порожній рядок у query (?role=) — те саме, що параметра немає. */
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

// ── Користувачі ─────────────────────────────────────────────

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.preprocess(emptyToUndefined, roleSchema.optional()),
  telegram: z.preprocess(emptyToUndefined, z.enum(['linked', 'unlinked']).optional()),
  status: z.preprocess(emptyToUndefined, z.enum(['active', 'blocked']).optional()),
  page: pageSchema,
});
export type AdminUsersQuery = z.input<typeof adminUsersQuerySchema>;

export const adminUserPatchSchema = z
  .object({
    role: roleSchema.optional(),
    blocked: z.boolean().optional(),
  })
  .refine((d) => d.role !== undefined || d.blocked !== undefined, 'Немає змін');
export type AdminUserPatch = z.infer<typeof adminUserPatchSchema>;

// ── Каталог ─────────────────────────────────────────────────

export const adminCategorySchema = z.object({
  name: z.string().trim().min(1, 'Вкажіть назву').max(40, 'Максимум 40 символів'),
  slug: z
    .string()
    .trim()
    .min(1, 'Вкажіть slug')
    .max(40, 'Максимум 40 символів')
    .regex(/^[a-z][a-z0-9-]*$/, 'Латиниця в нижньому регістрі, цифри й дефіс, наприклад music'),
});
export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;
export const adminCategoryPatchSchema = adminCategorySchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Немає змін');

const idSchema = z
  .number({ required_error: 'Оберіть значення', invalid_type_error: 'Оберіть значення' })
  .int('Оберіть значення')
  .positive('Оберіть значення');

/** Порожній рядок → null (необов'язкові текстові поля форми). */
const optionalText = (schema: z.ZodString) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), schema.nullable());

export const adminServiceSchema = z.object({
  name: z.string().trim().min(1, 'Вкажіть назву сервісу').max(60, 'Максимум 60 символів'),
  category_id: idSchema,
  website: optionalText(
    z
      .string()
      .trim()
      .max(200, 'Максимум 200 символів')
      .regex(/^https?:\/\/\S+\.\S+$/, 'Адреса має починатися з http:// або https://'),
  ).default(null),
  brand_color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Колір у форматі #RRGGBB, наприклад #1DB954'),
  icon: optionalText(
    z
      .string()
      .trim()
      .max(100, 'Максимум 100 символів')
      .regex(/^\/?[\w./-]+\.(png|svg|jpg|jpeg|webp)$/i, 'Файл іконки з public/icons, наприклад spotify.png'),
  ).default(null),
});
export type AdminServiceInput = z.input<typeof adminServiceSchema>;
export const adminServicePatchSchema = adminServiceSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Немає змін');
export type AdminServicePatch = z.input<typeof adminServicePatchSchema>;

export const adminServicesQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  page: pageSchema,
});
export type AdminServicesQuery = z.input<typeof adminServicesQuerySchema>;

export const adminPlanSchema = z.object({
  name: z.string().trim().min(1, 'Вкажіть назву тарифу').max(60, 'Максимум 60 символів'),
  price: z
    .number({ invalid_type_error: 'Вкажіть ціну' })
    .min(0, 'Ціна не може бути від’ємною')
    .max(1_000_000, 'Занадто велика сума'),
  currency: currencySchema,
  billing_period: billingPeriodSchema,
});
export type AdminPlanInput = z.infer<typeof adminPlanSchema>;
export const adminPlanPatchSchema = adminPlanSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, 'Немає змін');
