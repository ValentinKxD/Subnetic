import { Router } from 'express';
import { paymentMethodInputSchema } from '../../../shared/domain.js';
import { authUser } from '../auth/session.js';
import { parse } from '../services/errors.js';
import { createMethod, listMethods, removeMethod, updateMethod } from '../services/paymentMethods.js';
import { idParam } from './helpers.js';

export const paymentMethodsRouter = Router();

paymentMethodsRouter.get('/', (req, res) => {
  res.json(listMethods(authUser(req).id));
});

paymentMethodsRouter.post('/', (req, res) => {
  res.status(201).json(createMethod(authUser(req).id, parse(paymentMethodInputSchema, req.body)));
});

paymentMethodsRouter.patch('/:id', (req, res) => {
  const id = idParam(req);
  res.json(updateMethod(authUser(req).id, id, parse(paymentMethodInputSchema.partial(), req.body)));
});

paymentMethodsRouter.delete('/:id', (req, res) => {
  removeMethod(authUser(req).id, idParam(req));
  res.status(204).end();
});
