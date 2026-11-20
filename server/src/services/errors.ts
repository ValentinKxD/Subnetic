import type { ZodTypeAny, z } from 'zod';
import { fieldErrors } from '../../../shared/auth.js';

/** Помилка з HTTP-статусом */
export class HttpError extends Error {
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.fields = fields;
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) => new HttpError(400, message, fields);
export const unauthorized = (message = 'Потрібна авторизація') => new HttpError(401, message);
export const notFound = (what = 'Запис') => new HttpError(404, `${what} не знайдено`);
export const conflict = (message: string, fields?: Record<string, string>) => new HttpError(409, message, fields);

/** Валідує дані zod-схемою; при помилці кидає 400 з помилками полів. */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.output<S> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw badRequest('Перевірте правильність заповнення полів', fieldErrors(parsed.error));
  return parsed.data as z.output<S>;
}
