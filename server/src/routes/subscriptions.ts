import { Router } from 'express';
import {
  subscriptionCreateSchema,
  subscriptionQuerySchema,
  subscriptionUpdateSchema,
} from '../../../shared/domain.js';
import { authUser } from '../auth/session.js';
import { parse } from '../services/errors.js';
import {
  createSubscription,
  paySubscription,
  querySubscriptions,
  removeSubscription,
  updateSubscriptionById,
} from '../services/subscriptions.js';
import { ctxOf, idParam } from './helpers.js';

export const subscriptionsRouter = Router();

subscriptionsRouter.get('/', (req, res) => {
  res.json(querySubscriptions(ctxOf(req), parse(subscriptionQuerySchema, req.query)));
});

subscriptionsRouter.post('/', (req, res) => {
  res.status(201).json(createSubscription(ctxOf(req), parse(subscriptionCreateSchema, req.body)));
});

subscriptionsRouter.patch('/:id', (req, res) => {
  const id = idParam(req);
  res.json(updateSubscriptionById(ctxOf(req), id, parse(subscriptionUpdateSchema, req.body)));
});

subscriptionsRouter.delete('/:id', (req, res) => {
  removeSubscription(authUser(req).id, idParam(req));
  res.status(204).end();
});

/** Позначити найближчий платіж оплаченим (тригер БД зсуне next_payment_date). */
subscriptionsRouter.post('/:id/pay', (req, res) => {
  res.status(201).json(paySubscription(ctxOf(req), idParam(req)));
});
