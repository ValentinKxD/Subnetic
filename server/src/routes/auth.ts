import { Router } from 'express';
import { fieldErrors, loginSchema, registerSchema } from '../../../shared/auth.js';
import {
  createToken,
  createUser,
  deleteToken,
  findUserByEmail,
  findUserByIdentifier,
  findUserByNickname,
  toPublicUser,
} from '../data/store.js';
import { readBearerToken, requireAuth } from '../auth/session.js';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Перевірте правильність заповнення полів', fields: fieldErrors(parsed.error) });
    return;
  }
  const { nickname, email, phone, password } = parsed.data;

  const fields: Record<string, string> = {};
  if (findUserByNickname(nickname)) fields.nickname = 'Цей нікнейм уже зайнятий';
  if (findUserByEmail(email)) fields.email = 'Акаунт з таким email уже існує';
  if (Object.keys(fields).length > 0) {
    res.status(409).json({ error: 'Користувач уже існує', fields });
    return;
  }

  const user = createUser({ nickname, email, phone, password });
  res.status(201).json({ token: createToken(user.id), user: toPublicUser(user) });
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Перевірте правильність заповнення полів', fields: fieldErrors(parsed.error) });
    return;
  }
  // `remember` впливає лише на те, де клієнт зберігає токен (localStorage чи sessionStorage).
  const { identifier, password } = parsed.data;

  const user = findUserByIdentifier(identifier);
  // ЗАГЛУШКА: пряме порівняння пароля. На реальному бекенді — перевірка SHA-256-хешу.
  if (!user || user.password !== password) {
    res.status(401).json({ error: 'Невірний email/нікнейм або пароль' });
    return;
  }

  res.json({ token: createToken(user.id), user: toPublicUser(user) });
});

authRouter.post('/logout', (req, res) => {
  deleteToken(readBearerToken(req));
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user ? toPublicUser(req.user) : null });
});
