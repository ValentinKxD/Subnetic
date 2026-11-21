import { Router, type Request } from 'express';
import {
  adminCategoryPatchSchema,
  adminCategorySchema,
  adminPlanPatchSchema,
  adminPlanSchema,
  adminServicePatchSchema,
  adminServiceSchema,
  adminServicesQuerySchema,
  adminUserPatchSchema,
  adminUsersQuerySchema,
} from '../../../shared/admin.js';
import { authUser } from '../auth/session.js';
import {
  categoryTaken,
  deleteCategory,
  deletePlan,
  deleteService,
  deleteUser,
  findAdminUser,
  findCategory,
  findPlan,
  findService,
  getStats,
  insertCategory,
  insertPlan,
  insertService,
  listCategories,
  listCustomServices,
  listServices,
  listUsers,
  recentReminders,
  remindersSentToday,
  currentRates,
  serviceNameTaken,
  serviceSubscriptions,
  setUserBlocked,
  setUserRole,
  updateCategory,
  updatePlan,
  updateService,
  writeLog,
} from '../db/admin.js';
import { transaction } from '../db/index.js';
import { clearTelegram } from '../db/users.js';
import { saveNbuRates } from '../db/rates.js';
import { badRequest, conflict, HttpError, notFound, parse } from '../services/errors.js';
import { fetchNbuRates } from '../services/rates.js';
import type { BillingPeriod } from '../types.js';
import { idParam } from './helpers.js';

/** Адмін-панель. Змонтовано з requireAuth + requireAdmin. Кожна зміна пишеться в admin_log у тій самій транзакції. */
export const adminRouter = Router();

const adminId = (req: Request) => authUser(req).id;

// ── Огляд і система ─────────────────────────────────────────

adminRouter.get('/stats', (_req, res) => {
  res.json(getStats());
});

adminRouter.get('/system', (_req, res) => {
  res.json({ rates: currentRates(), reminders_today: remindersSentToday(), reminders: recentReminders(20) });
});

/** Ручне оновлення курсів НБУ: завантаження поза транзакцією, збереження + журнал — в одній. */
adminRouter.post('/rates/refresh', async (req, res) => {
  let nbu;
  try {
    nbu = await fetchNbuRates();
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    throw new HttpError(502, `Не вдалося оновити курси НБУ: ${reason}. Лишається збережений курс.`);
  }
  transaction(() => {
    saveNbuRates(nbu.rate_date, nbu);
    writeLog(adminId(req), 'rates.refresh', `Курси НБУ оновлено вручну: USD ${nbu.USD} ₴, EUR ${nbu.EUR} ₴ (${nbu.rate_date})`);
  });
  res.json({ ok: true, message: `Курси НБУ на ${nbu.rate_date} оновлено`, rates: currentRates() });
});

// ── Користувачі ─────────────────────────────────────────────

adminRouter.get('/users', (req, res) => {
  res.json(listUsers(parse(adminUsersQuerySchema, req.query)));
});

function userOr404(id: number) {
  const user = findAdminUser(id);
  if (!user) throw notFound('Користувача');
  return user;
}

adminRouter.patch('/users/:id', (req, res) => {
  const id = idParam(req);
  const data = parse(adminUserPatchSchema, req.body);
  if (id === adminId(req)) {
    if (data.role !== undefined) throw badRequest('Не можна змінити власну роль — це може зробити інший адміністратор');
    throw badRequest('Не можна заблокувати власний обліковий запис');
  }
  const user = userOr404(id);

  transaction(() => {
    if (data.role !== undefined && data.role !== user.role) {
      setUserRole(id, data.role);
      writeLog(
        adminId(req),
        'user.role',
        data.role === 'admin'
          ? `Користувачу ${user.nickname} надано роль адміністратора`
          : `У користувача ${user.nickname} знято роль адміністратора`,
      );
    }
    const blocked = user.blocked_at !== null;
    if (data.blocked !== undefined && data.blocked !== blocked) {
      setUserBlocked(id, data.blocked);
      writeLog(
        adminId(req),
        data.blocked ? 'user.block' : 'user.unblock',
        data.blocked ? `Заблоковано користувача ${user.nickname}` : `Розблоковано користувача ${user.nickname}`,
      );
    }
  });
  res.json(userOr404(id));
});

adminRouter.post('/users/:id/unlink-telegram', (req, res) => {
  const id = idParam(req);
  const user = userOr404(id);
  if (!user.telegram_linked) throw badRequest('Telegram у цього користувача не прив’язано');
  transaction(() => {
    clearTelegram(id);
    writeLog(adminId(req), 'user.unlink_tg', `Відв’язано Telegram користувача ${user.nickname}`);
  });
  res.json(userOr404(id));
});

adminRouter.delete('/users/:id', (req, res) => {
  const id = idParam(req);
  if (id === adminId(req)) throw badRequest('Не можна видалити власний обліковий запис');
  const user = userOr404(id);
  transaction(() => {
    deleteUser(id);
    writeLog(adminId(req), 'user.delete', `Видалено користувача ${user.nickname} (${user.email}) разом із його підписками`);
  });
  res.status(204).end();
});

// ── Категорії ───────────────────────────────────────────────

adminRouter.get('/categories', (_req, res) => {
  res.json({ items: listCategories() });
});

adminRouter.post('/categories', (req, res) => {
  const data = parse(adminCategorySchema, req.body);
  const taken = categoryTaken(data);
  if (Object.keys(taken).length > 0) throw conflict('Така категорія вже існує', taken);
  const id = transaction(() => {
    const newId = insertCategory(data);
    writeLog(adminId(req), 'category.create', `Додано категорію «${data.name}»`);
    return newId;
  });
  res.status(201).json(findCategory(id));
});

adminRouter.patch('/categories/:id', (req, res) => {
  const id = idParam(req);
  const data = parse(adminCategoryPatchSchema, req.body);
  const category = findCategory(id);
  if (!category) throw notFound('Категорію');
  const taken = categoryTaken(data, id);
  if (Object.keys(taken).length > 0) throw conflict('Така категорія вже існує', taken);
  transaction(() => {
    updateCategory(id, data);
    const name = data.name ?? category.name;
    writeLog(
      adminId(req),
      'category.update',
      name !== category.name ? `Категорію «${category.name}» перейменовано на «${name}»` : `Змінено категорію «${name}»`,
    );
  });
  res.json(findCategory(id));
});

adminRouter.delete('/categories/:id', (req, res) => {
  const id = idParam(req);
  const category = findCategory(id);
  if (!category) throw notFound('Категорію');
  if (category.all_services > 0) {
    throw conflict(
      `У категорії «${category.name}» є сервіси (${category.all_services}) — спершу перенесіть їх в іншу категорію`,
    );
  }
  transaction(() => {
    deleteCategory(id);
    writeLog(adminId(req), 'category.delete', `Видалено категорію «${category.name}»`);
  });
  res.status(204).end();
});

// ── Сервіси ─────────────────────────────────────────────────

adminRouter.get('/services', (req, res) => {
  res.json(listServices(parse(adminServicesQuerySchema, req.query)));
});

function serviceOr404(id: number) {
  const service = findService(id);
  if (!service) throw notFound('Сервіс');
  return service;
}

function checkCategory(id: number | undefined): void {
  if (id !== undefined && !findCategory(id)) {
    throw badRequest('Перевірте правильність заповнення полів', { category_id: 'Такої категорії немає' });
  }
}

adminRouter.post('/services', (req, res) => {
  const data = parse(adminServiceSchema, req.body);
  checkCategory(data.category_id);
  if (serviceNameTaken(data.name)) throw conflict('Сервіс уже є в каталозі', { name: 'Сервіс з такою назвою вже є' });
  const id = transaction(() => {
    const newId = insertService(data);
    writeLog(adminId(req), 'service.create', `Додано сервіс «${data.name}» у каталог`);
    return newId;
  });
  res.status(201).json(serviceOr404(id));
});

adminRouter.patch('/services/:id', (req, res) => {
  const id = idParam(req);
  const data = parse(adminServicePatchSchema, req.body);
  const service = serviceOr404(id);
  checkCategory(data.category_id);
  if (data.name !== undefined && serviceNameTaken(data.name, id)) {
    throw conflict('Сервіс уже є в каталозі', { name: 'Сервіс з такою назвою вже є' });
  }
  transaction(() => {
    updateService(id, data);
    const name = data.name ?? service.name;
    const moved = data.category_id !== undefined && data.category_id !== service.category_id;
    writeLog(
      adminId(req),
      'service.update',
      moved
        ? `Сервіс «${name}» перенесено в категорію «${findCategory(data.category_id as number)?.name}»`
        : name !== service.name
          ? `Сервіс «${service.name}» перейменовано на «${name}»`
          : `Змінено сервіс «${name}»`,
    );
  });
  res.json(serviceOr404(id));
});

adminRouter.delete('/services/:id', (req, res) => {
  const id = idParam(req);
  const service = serviceOr404(id);
  const subs = serviceSubscriptions(id);
  if (subs > 0) throw conflict(`На сервіс «${service.name}» є підписки (${subs}) — спершу перенесіть їх на інший сервіс`);
  transaction(() => {
    deleteService(id);
    writeLog(adminId(req), 'service.delete', `Видалено сервіс «${service.name}» разом із тарифами`);
  });
  res.status(204).end();
});

// ── Тарифи ──────────────────────────────────────────────────

const PERIOD: Record<BillingPeriod, string> = { week: 'тиждень', month: 'місяць', quarter: 'квартал', year: 'рік' };
const planText = (p: { name: string; price: number; currency: string; billing_period: BillingPeriod }) =>
  `«${p.name}» (${p.price} ${p.currency} / ${PERIOD[p.billing_period]})`;

adminRouter.post('/services/:id/plans', (req, res) => {
  const service = serviceOr404(idParam(req));
  const data = parse(adminPlanSchema, req.body);
  transaction(() => {
    insertPlan(service.id, data);
    writeLog(adminId(req), 'plan.create', `Додано тариф ${planText(data)} для ${service.name}`);
  });
  res.status(201).json(serviceOr404(service.id));
});

adminRouter.patch('/plans/:id', (req, res) => {
  const id = idParam(req);
  const plan = findPlan(id);
  if (!plan) throw notFound('Тариф');
  const data = parse(adminPlanPatchSchema, req.body);
  transaction(() => {
    updatePlan(id, data);
    writeLog(adminId(req), 'plan.update', `Змінено тариф ${planText({ ...plan, ...data })} для ${plan.service_name}`);
  });
  res.json(serviceOr404(plan.service_id));
});

adminRouter.delete('/plans/:id', (req, res) => {
  const id = idParam(req);
  const plan = findPlan(id);
  if (!plan) throw notFound('Тариф');
  if (plan.subscriptions > 0) throw conflict('Спершу перенесіть підписки на інший тариф');
  transaction(() => {
    deletePlan(id);
    writeLog(adminId(req), 'plan.delete', `Видалено тариф «${plan.name}» сервісу ${plan.service_name}`);
  });
  res.json(serviceOr404(plan.service_id));
});

// ── Власні сервіси користувачів ─────────────────────────────

adminRouter.get('/custom-services', (_req, res) => {
  res.json({ items: listCustomServices() });
});
