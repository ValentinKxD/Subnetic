import './env.js';
import { existsSync } from 'node:fs';
import path from 'node:path';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from './auth/session.js';
import { closeDb, DB_PATH, getDb } from './db/index.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';
import { dashboardRouter } from './routes/dashboard.js';
import { healthRouter } from './routes/health.js';
import { paymentMethodsRouter } from './routes/paymentMethods.js';
import { paymentsRouter } from './routes/payments.js';
import { ratesRouter } from './routes/rates.js';
import { profileRouter, settingsRouter, telegramRouter } from './routes/settings.js';
import { subscriptionsRouter } from './routes/subscriptions.js';
import { HttpError } from './services/errors.js';
import { startRatesUpdater } from './services/rates.js';
import { telegramConfig } from './services/telegram.js';

const PORT = Number(process.env.PORT ?? 3001);

// Відкриваємо БД одразу: на порожній базі застосується schema.sql.
const db = getDb();
const { n: categories } = db.prepare('SELECT count(*) AS n FROM categories').get() as { n: number };
if (categories === 0) console.warn(`БД порожня (${DB_PATH}). Заповніть її: npm run seed`);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Публічні
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Захищені: JWT у httpOnly-куці
app.use('/api/catalog', requireAuth, catalogRouter);
app.use('/api/rates', requireAuth, ratesRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/subscriptions', requireAuth, subscriptionsRouter);
app.use('/api/payments', requireAuth, paymentsRouter);
app.use('/api/payment-methods', requireAuth, paymentMethodsRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/profile', requireAuth, profileRouter);
app.use('/api/telegram', requireAuth, telegramRouter);

app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Не знайдено' });
});

// Зібраний сайт (client/dist) — у Docker/production, де немає Vite. У розробці CLIENT_DIST не задано.
const CLIENT_DIST = process.env.CLIENT_DIST?.trim();
if (CLIENT_DIST && existsSync(path.join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
  // Маршрути React Router (/subscriptions, /settings…) віддають index.html.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
  console.log(`Сайт віддається з ${CLIENT_DIST}`);
}

/** Єдиний формат помилок: `{error, fields?}`. */
app.use((err: Error & { type?: string; code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(err.fields ? { error: err.message, fields: err.fields } : { error: err.message });
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
    return;
  }
  // Порушення обмежень БД, які не відловила валідація (напр. одночасна реєстрація того самого email).
  if (err.code?.startsWith('SQLITE_CONSTRAINT')) {
    res.status(409).json({ error: 'Дані суперечать обмеженням бази даних' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

const server = app.listen(PORT, () => {
  console.log(`Subnetic API: http://localhost:${PORT}`);
  // Курси НБУ: одразу після старту (у фоні) і щодоби. Збій мережі сервер не зупиняє.
  startRatesUpdater();
  const tg = telegramConfig();
  console.log(
    tg
      ? `Telegram: бот @${tg.botName} (прив'язка і тестові повідомлення; нагадування надсилає bot/main.py)`
      : 'Telegram: TELEGRAM_BOT_TOKEN / TELEGRAM_BOT_NAME не задано — бот не налаштований.',
  );
});

// Коректна зупинка (docker stop, Ctrl+C): закриваємо БД, щоб дані з -wal перейшли в subnetic.db.
function shutdown(signal: string): void {
  console.log(`${signal}: зупинка сервера`);
  server.close();
  closeDb();
  process.exit(0);
}
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
