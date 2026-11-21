import { BLOCKED_MESSAGE, type LoginData, type ProfileData, type PublicUser, type RegisterData } from '../../../shared/auth.js';
import {
  findUserByEmail,
  findUserByNickname,
  insertUser,
  updateUserProfile,
} from '../db/users.js';
import type { User } from '../types.js';
import { conflict, HttpError } from './errors.js';
import { hashPassword, verifyPassword } from './password.js';

export function toPublicUser(u: User): PublicUser {
  return { id: u.id, nickname: u.nickname, email: u.email, phone: u.phone, role: u.role };
}

/** Зайняті нікнейм/email (крім самого користувача при редагуванні профілю). */
function takenFields(nickname: string, email: string, exceptUserId?: number): Record<string, string> {
  const fields: Record<string, string> = {};
  const byNick = findUserByNickname(nickname);
  if (byNick && byNick.id !== exceptUserId) fields.nickname = 'Цей нікнейм уже зайнятий';
  const byEmail = findUserByEmail(email);
  if (byEmail && byEmail.id !== exceptUserId) fields.email = 'Акаунт з таким email уже існує';
  return fields;
}

export function register(data: RegisterData): User {
  const fields = takenFields(data.nickname, data.email);
  if (Object.keys(fields).length > 0) throw conflict('Користувач уже існує', fields);
  return insertUser({
    nickname: data.nickname,
    email: data.email,
    phone: data.phone ?? null,
    password_hash: hashPassword(data.password),
  });
}

/** Вхід за email (якщо містить @) або нікнеймом. */
export function login(data: LoginData): User {
  const identifier = data.identifier.trim();
  const user = identifier.includes('@') ? findUserByEmail(identifier) : findUserByNickname(identifier);
  if (!user || !verifyPassword(data.password, user.password_hash)) {
    throw new HttpError(401, 'Невірний email/нікнейм або пароль');
  }
  if (user.blocked_at !== null) throw new HttpError(403, BLOCKED_MESSAGE);
  return user;
}

export function updateProfile(userId: number, data: ProfileData): User {
  const fields = takenFields(data.nickname, data.email, userId);
  if (Object.keys(fields).length > 0) throw conflict('Дані вже використовуються', fields);
  return updateUserProfile(userId, { nickname: data.nickname, email: data.email, phone: data.phone ?? null });
}
