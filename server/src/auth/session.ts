import type { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../db/users.js';
import type { User } from '../types.js';

/** Сесія: JWT у httpOnly-куці (JavaScript сторінки її не бачить) */

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export const SESSION_COOKIE = 'subnetic_session';

const REMEMBER_TTL_SEC = 30 * 24 * 60 * 60;
const SESSION_TTL_SEC = 24 * 60 * 60;

const DEV_SECRET = 'subnetic-dev-secret-change-me';
const JWT_SECRET = process.env.JWT_SECRET ?? DEV_SECRET;
if (JWT_SECRET === DEV_SECRET) {
  console.warn('JWT_SECRET не задано — використовується dev-ключ (не для продакшну).');
}

const isProd = process.env.NODE_ENV === 'production';

function baseCookie(): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' };
}

interface TokenPayload {
  sub: string;
}

export function startSession(res: Response, userId: number, remember: boolean): void {
  const ttl = remember ? REMEMBER_TTL_SEC : SESSION_TTL_SEC;
  const token = jwt.sign({}, JWT_SECRET, { subject: String(userId), expiresIn: ttl, algorithm: 'HS256' });
  res.cookie(SESSION_COOKIE, token, remember ? { ...baseCookie(), maxAge: ttl * 1000 } : baseCookie());
}

export function endSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, baseCookie());
}

/** id користувача з валідного JWT або undefined (немає куки, підпис/термін невалідні). */
function readUserId(req: Request): number | undefined {
  const token: unknown = req.cookies?.[SESSION_COOKIE];
  if (typeof token !== 'string' || token === '') return undefined;
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

/** Middleware для захищених маршрутів: 401, якщо сесії немає або користувача вже не існує. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = readUserId(req);
  const user = userId !== undefined ? findUserById(userId) : undefined;
  if (!user) {
    if (req.cookies?.[SESSION_COOKIE]) endSession(res);
    res.status(401).json({ error: 'Потрібна авторизація' });
    return;
  }
  req.user = user;
  next();
}

/** Користувач із requireAuth (маршрути без нього сюди не потрапляють). */
export function authUser(req: Request): User {
  if (!req.user) throw new Error('requireAuth не застосовано до маршруту');
  return req.user;
}
