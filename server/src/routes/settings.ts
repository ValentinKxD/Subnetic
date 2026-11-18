import { Router } from 'express';
import { profileSchema } from '../../../shared/auth.js';
import { settingsPatchSchema } from '../../../shared/domain.js';
import { findUserByEmail, findUserByNickname, getSettings, toPublicUser, updateUser } from '../data/store.js';
import type { Settings, SettingsDTO } from '../data/types.js';
import { authUser, validate } from './helpers.js';

function toDTO(s: Settings): SettingsDTO {
  return {
    currency: s.currency,
    theme: s.theme,
    remind_7: s.remind_7,
    remind_3: s.remind_3,
    remind_1: s.remind_1,
    remind_hour: s.remind_hour,
    telegram: {
      linked: s.telegram_username !== null,
      username: s.telegram_username,
      linked_at: s.telegram_linked_at,
    },
  };
}

// ── /api/settings ───────────────────────────────────────────

export const settingsRouter = Router();

settingsRouter.get('/', (req, res) => {
  res.json(toDTO(getSettings(authUser(req).id)));
});

settingsRouter.patch('/', (req, res) => {
  const user = authUser(req);
  const data = validate(settingsPatchSchema, req.body, res);
  if (!data) return;
  const s = getSettings(user.id);
  Object.assign(s, data);
  res.json(toDTO(s));
});

// ── /api/profile ────────────────────────────────────────────

export const profileRouter = Router();

profileRouter.patch('/', (req, res) => {
  const user = authUser(req);
  const data = validate(profileSchema, req.body, res);
  if (!data) return;

  const fields: Record<string, string> = {};
  const byNick = findUserByNickname(data.nickname);
  if (byNick && byNick.id !== user.id) fields.nickname = 'Цей нікнейм уже зайнятий';
  const byEmail = findUserByEmail(data.email);
  if (byEmail && byEmail.id !== user.id) fields.email = 'Акаунт з таким email уже існує';
  if (Object.keys(fields).length > 0) {
    res.status(409).json({ error: 'Дані вже використовуються', fields });
    return;
  }

  const updated = updateUser(user.id, { nickname: data.nickname, email: data.email, phone: data.phone ?? null });
  res.json({ user: updated ? toPublicUser(updated) : null });
});

// ── /api/telegram (заглушки) ────────────────────────────────

export const telegramRouter = Router();

/** ЗАГЛУШКА: повертає фейкове посилання на бота й одразу позначає акаунт прив'язаним. */
telegramRouter.post('/link', (req, res) => {
  const user = authUser(req);
  const s = getSettings(user.id);
  const code = Math.random().toString(36).slice(2, 10);
  s.telegram_username = `@${user.nickname}`;
  s.telegram_linked_at = new Date().toISOString();
  res.json({ url: `https://t.me/subnetic_demo_bot?start=${code}`, settings: toDTO(s) });
});

telegramRouter.post('/unlink', (req, res) => {
  const s = getSettings(authUser(req).id);
  s.telegram_username = null;
  s.telegram_linked_at = null;
  res.json({ settings: toDTO(s) });
});

telegramRouter.post('/test', (req, res) => {
  const s = getSettings(authUser(req).id);
  if (!s.telegram_username) {
    res.status(409).json({ error: 'Спершу прив’яжіть Telegram' });
    return;
  }
  res.json({ ok: true, message: `Тестове повідомлення надіслано в ${s.telegram_username} (демо: насправді нічого не відправлено).` });
});
