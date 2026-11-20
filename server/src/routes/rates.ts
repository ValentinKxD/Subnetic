import { Router } from 'express';
import { getCurrentRates } from '../db/rates.js';

export const ratesRouter = Router();

/** Актуальні курси: скільки гривень за одиницю валюти */
ratesRouter.get('/', (_req, res) => {
  const { rates, rate_date, updated_at, source } = getCurrentRates();
  res.json({ base: 'UAH', rates, rate_date, updated_at, source });
});
