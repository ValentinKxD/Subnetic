import type { Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { fieldErrors } from '../../../shared/auth.js';
import type { Currency } from '../../../shared/money.js';
import { getSettings } from '../data/store.js';
import type { User } from '../data/types.js';

/** Користувач із requireAuth (маршрути без нього сюди не потрапляють). */
export function authUser(req: Request): User {
  if (!req.user) throw new Error('requireAuth не застосовано до маршруту');
  return req.user;
}

export function userCurrency(userId: number): Currency {
  return getSettings(userId).currency;
}

/** Валідує дані zod-схемою; при помилці відповідає 400 `{error, fields}` і повертає null. */
export function validate<S extends ZodTypeAny>(schema: S, data: unknown, res: Response): z.output<S> | null {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data as z.output<S>;
  res.status(400).json({ error: 'Перевірте правильність заповнення полів', fields: fieldErrors(parsed.error) });
  return null;
}

/** id з параметра маршруту або 404. */
export function idParam(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (Number.isInteger(id) && id > 0) return id;
  res.status(404).json({ error: 'Не знайдено' });
  return null;
}

export function notFound(res: Response, what = 'Запис'): void {
  res.status(404).json({ error: `${what} не знайдено` });
}
