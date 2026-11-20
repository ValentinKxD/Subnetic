import { Router } from 'express';
import { buildDashboard } from '../services/dashboard.js';
import { ctxOf } from './helpers.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', (req, res) => {
  res.json(buildDashboard(ctxOf(req)));
});
