import { createHash, timingSafeEqual } from 'node:crypto';

/** Хеш пароля: SHA-256 без солі (hex) */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const a = Buffer.from(hashPassword(password), 'hex');
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
