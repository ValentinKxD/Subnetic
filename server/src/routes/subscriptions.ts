import { Router, type Response } from 'express';
import { addPeriod, todayISO } from '../../../shared/dates.js';
import {
  subscriptionCreateSchema,
  subscriptionQuerySchema,
  subscriptionUpdateSchema,
} from '../../../shared/domain.js';
import {
  createSubscription,
  deleteSubscription,
  findPaymentMethod,
  findPlan,
  findService,
  findSubscription,
  isVisibleTo,
  recordPayment,
} from '../data/store.js';
import type { Plan } from '../data/types.js';
import { paymentToDTO } from '../services/schedule.js';
import { applyStatus, initialSchedule, querySubscriptions, toSubscriptionDTO } from '../services/subscriptions.js';
import { authUser, idParam, notFound, userCurrency, validate } from './helpers.js';

export const subscriptionsRouter = Router();

function visiblePlan(userId: number, planId: number, res: Response): Plan | null {
  const plan = findPlan(planId);
  const service = plan ? findService(plan.service_id) : undefined;
  if (!plan || !service || !isVisibleTo(plan, userId) || !isVisibleTo(service, userId)) {
    res.status(400).json({ error: 'Невідомий тариф', fields: { plan_id: 'Оберіть тариф' } });
    return null;
  }
  return plan;
}

function checkPaymentMethod(userId: number, id: number | null | undefined, res: Response): boolean {
  if (id === null || id === undefined || findPaymentMethod(userId, id)) return true;
  res.status(400).json({ error: 'Невідомий спосіб оплати', fields: { payment_method_id: 'Оберіть спосіб оплати' } });
  return false;
}

subscriptionsRouter.get('/', (req, res) => {
  const user = authUser(req);
  const query = validate(subscriptionQuerySchema, req.query, res);
  if (!query) return;
  res.json(querySubscriptions(user.id, userCurrency(user.id), query));
});

subscriptionsRouter.post('/', (req, res) => {
  const user = authUser(req);
  const data = validate(subscriptionCreateSchema, req.body, res);
  if (!data) return;
  const plan = visiblePlan(user.id, data.plan_id, res);
  if (!plan || !checkPaymentMethod(user.id, data.payment_method_id, res)) return;

  const { status, next_payment_date } = initialSchedule(data.start_date, data.trial_end_date, plan.billing_period);
  const sub = createSubscription({
    user_id: user.id,
    plan_id: plan.id,
    status,
    start_date: data.start_date,
    trial_end_date: data.trial_end_date,
    next_payment_date,
    auto_renew: data.auto_renew,
    payment_method_id: data.payment_method_id,
  });
  res.status(201).json(toSubscriptionDTO(sub, userCurrency(user.id)));
});

subscriptionsRouter.patch('/:id', (req, res) => {
  const user = authUser(req);
  const id = idParam(req, res);
  if (id === null) return;
  const sub = findSubscription(user.id, id);
  if (!sub) return notFound(res, 'Підписку');
  const data = validate(subscriptionUpdateSchema, req.body, res);
  if (!data) return;

  let plan = findPlan(sub.plan_id);
  if (data.plan_id !== undefined) {
    const p = visiblePlan(user.id, data.plan_id, res);
    if (!p) return;
    plan = p;
    sub.plan_id = p.id;
  }
  if (!plan) return notFound(res, 'Тариф');
  if (!checkPaymentMethod(user.id, data.payment_method_id, res)) return;

  if (data.payment_method_id !== undefined) sub.payment_method_id = data.payment_method_id;
  if (data.start_date !== undefined) sub.start_date = data.start_date;
  if (data.trial_end_date !== undefined) sub.trial_end_date = data.trial_end_date;
  if (data.auto_renew !== undefined) sub.auto_renew = data.auto_renew;
  if (data.next_payment_date !== undefined) sub.next_payment_date = data.next_payment_date;

  // Зміна дат без явного статусу: перераховуємо графік так само, як при створенні.
  const datesChanged = data.start_date !== undefined || data.trial_end_date !== undefined || data.plan_id !== undefined;
  if (datesChanged && data.next_payment_date === undefined && data.status === undefined && (sub.status === 'active' || sub.status === 'trial')) {
    const s = initialSchedule(sub.start_date, sub.trial_end_date, plan.billing_period);
    sub.status = s.status;
    sub.next_payment_date = s.next_payment_date;
  }
  if (data.status !== undefined && data.status !== sub.status) applyStatus(sub, plan, data.status);

  if (sub.trial_end_date && sub.trial_end_date <= sub.start_date) {
    res.status(400).json({
      error: 'Перевірте дати',
      fields: { trial_end_date: 'Кінець пробного періоду має бути після дати початку' },
    });
    return;
  }
  res.json(toSubscriptionDTO(sub, userCurrency(user.id)));
});

subscriptionsRouter.delete('/:id', (req, res) => {
  const user = authUser(req);
  const id = idParam(req, res);
  if (id === null) return;
  if (!deleteSubscription(user.id, id)) return notFound(res, 'Підписку');
  res.status(204).end();
});

/** Позначити найближчий платіж оплаченим: запис у історію + зсув next_payment_date. */
subscriptionsRouter.post('/:id/pay', (req, res) => {
  const user = authUser(req);
  const id = idParam(req, res);
  if (id === null) return;
  const sub = findSubscription(user.id, id);
  if (!sub) return notFound(res, 'Підписку');
  const plan = findPlan(sub.plan_id);
  if (!plan) return notFound(res, 'Тариф');
  if (!sub.next_payment_date || !(sub.status === 'active' || sub.status === 'trial')) {
    res.status(409).json({ error: 'Для цієї підписки немає очікуваного платежу' });
    return;
  }

  const payment = recordPayment(sub, { due_date: sub.next_payment_date, paid_at: todayISO() });
  sub.next_payment_date = sub.auto_renew ? addPeriod(sub.next_payment_date, plan.billing_period) : null;
  if (sub.status === 'trial') sub.status = 'active';
  if (!sub.auto_renew) sub.status = 'expired';

  const currency = userCurrency(user.id);
  res.status(201).json({ payment: paymentToDTO(payment, currency), subscription: toSubscriptionDTO(sub, currency) });
});
