import { Router } from 'express';
import { DEFAULT_RATES } from '../../../shared/money.js';

export const ratesRouter = Router();

/** ЗАГЛУШКА: фіксовані курси (скільки гривень за одиницю валюти). */
ratesRouter.get('/', (_req, res) => {
  res.json({ base: 'UAH', rates: DEFAULT_RATES, updated_at: new Date().toISOString().slice(0, 10) });
});
