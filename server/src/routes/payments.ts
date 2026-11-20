import { Router } from 'express';
import { z } from 'zod';
import { isISOMonth, monthOf, monthRange, todayISO } from '../../../shared/dates.js';
import { paymentHistoryQuerySchema } from '../../../shared/domain.js';
import { parse } from '../services/errors.js';
import { paymentHistory, scheduleBetween, summarize } from '../services/schedule.js';
import { ctxOf } from './helpers.js';

export const paymentsRouter = Router();

const calendarQuerySchema = z.object({
  month: z
    .string()
    .refine(isISOMonth, 'Місяць у форматі YYYY-MM')
    .default(() => monthOf(todayISO())),
});

/** Минулі (з БД) + майбутні (обчислені) платежі за місяць. */
paymentsRouter.get('/calendar', (req, res) => {
  const ctx = ctxOf(req);
  const { month } = parse(calendarQuerySchema, req.query);
  const { start, end } = monthRange(month);
  const items = scheduleBetween(ctx, start, end);
  res.json({ month, currency: ctx.currency, items, summary: summarize(items) });
});

/** Історія здійснених платежів з фільтрами. */
paymentsRouter.get('/', (req, res) => {
  res.json(paymentHistory(ctxOf(req), parse(paymentHistoryQuerySchema, req.query)));
});
