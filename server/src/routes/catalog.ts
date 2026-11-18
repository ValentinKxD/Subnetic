import { Router } from 'express';
import { customPlanSchema, customServiceSchema } from '../../../shared/domain.js';
import { createPlan, createService, db, findCategory, findService, isVisibleTo } from '../data/store.js';
import type { CatalogDTO } from '../data/types.js';
import { authUser, validate } from './helpers.js';

export const catalogRouter = Router();

/** Каталог: глобальні сервіси + власні сервіси/тарифи користувача. */
catalogRouter.get('/', (req, res) => {
  const user = authUser(req);
  const catalog: CatalogDTO = {
    categories: db.categories,
    services: db.services
      .filter((s) => isVisibleTo(s, user.id))
      .map(({ owner_id, ...s }) => ({
        ...s,
        category: findCategory(s.category_id)?.name ?? 'Інше',
        is_custom: owner_id !== null,
        plans: db.plans
          .filter((p) => p.service_id === s.id && isVisibleTo(p, user.id))
          .map(({ service_id: _sid, owner_id: planOwner, ...p }) => ({ ...p, is_custom: planOwner !== null })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'uk')),
  };
  res.json(catalog);
});

catalogRouter.post('/services', (req, res) => {
  const user = authUser(req);
  const data = validate(customServiceSchema, req.body, res);
  if (!data) return;
  if (!findCategory(data.category_id)) {
    res.status(400).json({ error: 'Невідома категорія', fields: { category_id: 'Оберіть категорію' } });
    return;
  }
  const duplicate = db.services.find(
    (s) => isVisibleTo(s, user.id) && s.name.toLowerCase() === data.name.toLowerCase(),
  );
  if (duplicate) {
    res.status(409).json({ error: 'Такий сервіс уже є', fields: { name: 'Такий сервіс уже є в каталозі' } });
    return;
  }
  const service = createService({
    name: data.name,
    category_id: data.category_id,
    icon: '',
    brand_color: '#635BFF',
    website: '',
    owner_id: user.id,
  });
  res.status(201).json({ ...service, is_custom: true });
});

catalogRouter.post('/plans', (req, res) => {
  const user = authUser(req);
  const data = validate(customPlanSchema, req.body, res);
  if (!data) return;
  const service = findService(data.service_id);
  if (!service || !isVisibleTo(service, user.id)) {
    res.status(400).json({ error: 'Невідомий сервіс', fields: { service_id: 'Оберіть сервіс' } });
    return;
  }
  const plan = createPlan({ ...data, owner_id: user.id });
  res.status(201).json({ ...plan, is_custom: true });
});
