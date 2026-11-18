import { Router } from 'express';
import { buildDashboard } from '../services/dashboard.js';
import { authUser, userCurrency } from './helpers.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', (req, res) => {
  const user = authUser(req);
  res.json(buildDashboard(user.id, userCurrency(user.id)));
});
