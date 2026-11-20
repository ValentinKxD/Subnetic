import { Router } from 'express';
import { customPlanSchema, customServiceSchema } from '../../../shared/domain.js';
import { authUser } from '../auth/session.js';
import { createCustomPlan, createCustomService, getCatalog } from '../services/catalog.js';
import { parse } from '../services/errors.js';

export const catalogRouter = Router();

catalogRouter.get('/', (req, res) => {
  res.json(getCatalog(authUser(req).id));
});

catalogRouter.post('/services', (req, res) => {
  res.status(201).json(createCustomService(authUser(req).id, parse(customServiceSchema, req.body)));
});

catalogRouter.post('/plans', (req, res) => {
  res.status(201).json(createCustomPlan(authUser(req).id, parse(customPlanSchema, req.body)));
});
