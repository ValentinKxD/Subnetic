import type { CustomPlanInput, CustomServiceInput } from '../../../shared/domain.js';
import {
  findCategory,
  findVisibleService,
  insertPlan,
  insertService,
  listCategories,
  listVisiblePlans,
  listVisibleServices,
  visibleServiceNameExists,
} from '../db/catalog.js';
import type { CatalogDTO, CatalogPlanDTO, Plan } from '../types.js';
import { badRequest, conflict } from './errors.js';

/** Колір за замовчуванням для власних сервісів. */
const CUSTOM_SERVICE_COLOR = '#635BFF';

/** Каталог: глобальні сервіси/тарифи + власні сервіси/тарифи користувача. */
export function getCatalog(userId: number): CatalogDTO {
  const categories = listCategories();
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const plansByService = new Map<number, CatalogPlanDTO[]>();
  for (const p of listVisiblePlans(userId)) {
    const list = plansByService.get(p.service_id) ?? [];
    list.push({
      id: p.id,
      name: p.name,
      price: p.price,
      currency: p.currency,
      billing_period: p.billing_period,
      is_custom: p.user_id !== null,
    });
    plansByService.set(p.service_id, list);
  }

  const services = listVisibleServices(userId)
    .map((s) => ({
      id: s.id,
      category_id: s.category_id,
      category: categoryName.get(s.category_id) ?? 'Інше',
      name: s.name,
      icon: s.icon ?? '',
      brand_color: s.brand_color,
      website: s.website ?? '',
      is_custom: s.owner_user_id !== null,
      plans: plansByService.get(s.id) ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));

  return { categories, services };
}

export function createCustomService(userId: number, data: CustomServiceInput) {
  if (!findCategory(data.category_id)) throw badRequest('Невідома категорія', { category_id: 'Оберіть категорію' });
  if (visibleServiceNameExists(userId, data.name)) {
    throw conflict('Такий сервіс уже є', { name: 'Такий сервіс уже є в каталозі' });
  }
  const s = insertService({
    owner_user_id: userId,
    category_id: data.category_id,
    name: data.name,
    brand_color: CUSTOM_SERVICE_COLOR,
  });
  return {
    id: s.id,
    name: s.name,
    category_id: s.category_id,
    icon: '',
    brand_color: s.brand_color,
    website: '',
    is_custom: true,
  };
}

export function createCustomPlan(userId: number, data: CustomPlanInput): Plan & { is_custom: true } {
  if (!findVisibleService(userId, data.service_id)) {
    throw badRequest('Невідомий сервіс', { service_id: 'Оберіть сервіс' });
  }
  const plan = insertPlan({ ...data, user_id: userId });
  return { ...plan, is_custom: true };
}
