import { Router } from 'express';
import { paymentMethodInputSchema } from '../../../shared/domain.js';
import {
  createPaymentMethod,
  deletePaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from '../data/store.js';
import type { PaymentMethod } from '../data/types.js';
import { authUser, idParam, notFound, validate } from './helpers.js';

export const paymentMethodsRouter = Router();

const toDTO = ({ user_id: _u, ...m }: PaymentMethod) => m;

paymentMethodsRouter.get('/', (req, res) => {
  const user = authUser(req);
  res.json({ items: listPaymentMethods(user.id).map(toDTO) });
});

paymentMethodsRouter.post('/', (req, res) => {
  const user = authUser(req);
  const data = validate(paymentMethodInputSchema, req.body, res);
  if (!data) return;
  res.status(201).json(toDTO(createPaymentMethod(user.id, data)));
});

paymentMethodsRouter.patch('/:id', (req, res) => {
  const user = authUser(req);
  const id = idParam(req, res);
  if (id === null) return;
  const data = validate(paymentMethodInputSchema.partial(), req.body, res);
  if (!data) return;
  const m = updatePaymentMethod(user.id, id, data);
  if (!m) return notFound(res, 'Спосіб оплати');
  res.json(toDTO(m));
});

paymentMethodsRouter.delete('/:id', (req, res) => {
  const user = authUser(req);
  const id = idParam(req, res);
  if (id === null) return;
  if (!deletePaymentMethod(user.id, id)) return notFound(res, 'Спосіб оплати');
  res.status(204).end();
});
