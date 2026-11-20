import { Router } from 'express';
import { loginSchema, registerSchema } from '../../../shared/auth.js';
import { authUser, endSession, requireAuth, startSession } from '../auth/session.js';
import { login, register, toPublicUser } from '../services/auth.js';
import { parse } from '../services/errors.js';

export const authRouter = Router();

/** Реєстрація: сесія як при вході без «Запам'ятати мене». */
authRouter.post('/register', (req, res) => {
  const user = register(parse(registerSchema, req.body));
  startSession(res, user.id, false);
  res.status(201).json({ user: toPublicUser(user) });
});

authRouter.post('/login', (req, res) => {
  const data = parse(loginSchema, req.body);
  const user = login(data);
  startSession(res, user.id, data.remember);
  res.json({ user: toPublicUser(user) });
});

authRouter.post('/logout', (_req, res) => {
  endSession(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: toPublicUser(authUser(req)) });
});
