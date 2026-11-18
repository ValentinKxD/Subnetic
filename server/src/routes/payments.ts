import { Router } from 'express';
import { z } from 'zod';
import { isISOMonth, monthOf, monthRange, todayISO } from '../../../shared/dates.js';
import { paymentHistoryQuerySchema } from '../../../shared/domain.js';
import { round2 } from '../../../shared/money.js';
import { listPayments } from '../data/store.js';
import { paymentToDTO, scheduleBetween, summarize } from '../services/schedule.js';
import { authUser, userCurrency, validate } from './helpers.js';

export const paymentsRouter = Router();

const calendarQuerySchema = z.object({
  month: z
    .string()
    .refine(isISOMonth, 'Місяць у форматі YYYY-MM')
    .default(() => monthOf(todayISO())),
});

/** Минулі (з історії) + майбутні (обчислені) платежі за місяць. */
paymentsRouter.get('/calendar', (req, res) => {
  const user = authUser(req);
  const query = validate(calendarQuerySchema, req.query, res);
  if (!query) return;
  const currency = userCurrency(user.id);
  const { start, end } = monthRange(query.month);
  const items = scheduleBetween(user.id, start, end, currency);
  res.json({ month: query.month, currency, items, summary: summarize(items) });
});

/** Історія здійснених платежів з фільтрами. */
paymentsRouter.get('/', (req, res) => {
  const user = authUser(req);
  const query = validate(paymentHistoryQuerySchema, req.query, res);
  if (!query) return;
  const currency = userCurrency(user.id);
  const q = query.q?.toLowerCase();

  const items = listPayments(user.id)
    .filter(
      (p) =>
        (!query.from || p.due_date >= query.from) &&
        (!query.to || p.due_date <= query.to) &&
        (!query.status || p.status === query.status) &&
        (!query.subscription_id || p.subscription_id === query.subscription_id) &&
        (!q || p.service_name.toLowerCase().includes(q) || p.plan_name.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.due_date.localeCompare(a.due_date) || b.id - a.id)
    .map((p) => paymentToDTO(p, currency));

  const total = round2(items.filter((p) => p.status === 'paid').reduce((s, p) => s + p.converted_amount, 0));
  res.json({ items, total, currency });
});
