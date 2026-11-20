import type { Request } from 'express';
import { authUser } from '../auth/session.js';
import { userContext } from '../services/context.js';
import { notFound } from '../services/errors.js';
import type { UserContext } from '../types.js';

/** Валюта й курси поточного користувача. */
export function ctxOf(req: Request): UserContext {
  return userContext(authUser(req).id);
}

/** id з параметра маршруту або 404. */
export function idParam(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound();
  return id;
}
