import { z } from 'zod';

/**
 * Спільні схеми автентифікації: їх використовують і клієнт (валідація форм),
 * і сервер (валідація тіла запиту). Повідомлення — українською.
 */

export const NICKNAME_MIN = 3;
export const NICKNAME_MAX = 32;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, 'Вкажіть нікнейм')
  .refine((v) => !v.includes('@'), 'Нікнейм не може містити символ @')
  .refine((v) => v.length >= NICKNAME_MIN, `Мінімум ${NICKNAME_MIN} символи`)
  .refine((v) => v.length <= NICKNAME_MAX, `Максимум ${NICKNAME_MAX} символи`)
  .refine(
    (v) => /^[\p{L}\p{N}_.-]+$/u.test(v),
    'Лише літери, цифри та символи _ . -',
  );

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Вкажіть email')
  .email('Некоректний email')
  .transform((v) => v.toLowerCase());

/** Телефон необов'язковий: порожній рядок вважаємо відсутнім значенням. */
export const phoneSchema = z
  .string()
  .trim()
  .refine(
    (v) => v === '' || (/^\+?[\d\s()-]+$/.test(v) && v.replace(/\D/g, '').length >= 10 && v.replace(/\D/g, '').length <= 15),
    'Некоректний номер, наприклад +380 67 123 45 67',
  )
  .transform((v) => (v === '' ? undefined : v.replace(/[\s()-]/g, '')))
  .optional();

export const passwordSchema = z
  .string()
  .min(1, 'Вкажіть пароль')
  .min(PASSWORD_MIN, `Мінімум ${PASSWORD_MIN} символів`)
  .max(PASSWORD_MAX, `Максимум ${PASSWORD_MAX} символи`);

const registerFields = z.object({
  nickname: nicknameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Повторіть пароль'),
});

/**
 * Звичайний `.refine` на об'єкті не запускається, поки невалідні окремі поля,
 * тож «Паролі не збігаються» з'являлося б лише після виправлення решти.
 * Тому перевіряємо поля та збіг паролів разом у superRefine.
 */
export const registerSchema = z
  .object({
    nickname: z.string(),
    email: z.string(),
    phone: z.string().optional(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((d, ctx) => {
    const r = registerFields.safeParse(d);
    if (!r.success) r.error.issues.forEach((issue) => ctx.addIssue(issue));
    if (d.confirmPassword !== '' && d.password !== d.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmPassword'], message: 'Паролі не збігаються' });
    }
  })
  .transform((d) => registerFields.parse(d));

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Вкажіть email або нікнейм'),
  password: z.string().min(1, 'Вкажіть пароль'),
  remember: z.boolean().default(false),
});

/** Оновлення профілю в налаштуваннях (ті самі правила, що й при реєстрації). */
export const profileSchema = z.object({
  nickname: nicknameSchema,
  email: emailSchema,
  phone: phoneSchema,
});
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type RegisterInput = z.input<typeof registerSchema>;
export type RegisterData = z.output<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type LoginData = z.output<typeof loginSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

/** Публічні дані користувача, що повертає API. */
export const publicUserSchema = z.object({
  id: z.number(),
  nickname: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

/** Відповідь `GET /api/auth/me`. */
export const meResponseSchema = z.object({ user: publicUserSchema });

/** Відповідь `POST /api/auth/login` і `/register`. */
export const authResponseSchema = z.object({ token: z.string().min(1), user: publicUserSchema });
export type AuthResponse = z.infer<typeof authResponseSchema>;

/** Формат помилки API: загальне повідомлення + помилки окремих полів. */
export interface ApiErrorBody {
  error: string;
  fields?: Record<string, string>;
}

/** Перетворює ZodError на {поле: перше повідомлення}. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : '_form';
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
