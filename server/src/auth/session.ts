import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorBody } from '../../../shared/auth.js';
import { getUserById, getUserIdByToken } from '../data/store.js';
import type { User } from '../data/types.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    token?: string;
  }
}

/** Дістає токен із заголовка `Authorization: Bearer <token>`. */
export function readBearerToken(req: Request): string | undefined {
  const header = req.get('authorization');
  if (!header) return undefined;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token.trim() : undefined;
}

/** Middleware для захищених маршрутів: 401, якщо токена немає або він невідомий серверу. */
export function requireAuth(req: Request, res: Response<ApiErrorBody>, next: NextFunction): void {
  const token = readBearerToken(req);
  const userId = getUserIdByToken(token);
  const user = userId !== undefined ? getUserById(userId) : undefined;
  if (!token || !user) {
    res.status(401).json({ error: 'Потрібна авторизація' });
    return;
  }
  req.user = user;
  req.token = token;
  next();
}
