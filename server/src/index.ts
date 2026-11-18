import express, { type NextFunction, type Request, type Response } from 'express';
import { requireAuth } from './auth/session.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';
import { dashboardRouter } from './routes/dashboard.js';
import { healthRouter } from './routes/health.js';
import { paymentMethodsRouter } from './routes/paymentMethods.js';
import { paymentsRouter } from './routes/payments.js';
import { ratesRouter } from './routes/rates.js';
import { profileRouter, settingsRouter, telegramRouter } from './routes/settings.js';
import { subscriptionsRouter } from './routes/subscriptions.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(express.json());

// Публічні
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);

// Захищені: Authorization: Bearer <token>
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

app.use((err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Некоректний JSON у тілі запиту' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Внутрішня помилка сервера' });
});

app.listen(PORT, () => {
  console.log(`Subnetic API: http://localhost:${PORT}`);
});
