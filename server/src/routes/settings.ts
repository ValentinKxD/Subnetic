import { Router } from 'express';
import { profileSchema } from '../../../shared/auth.js';
import { settingsPatchSchema } from '../../../shared/domain.js';
import { authUser } from '../auth/session.js';
import { toPublicUser, updateProfile } from '../services/auth.js';
import { parse } from '../services/errors.js';
import { patchSettings, readSettings } from '../services/settings.js';
import { createLinkUrl, sendNearestReminder, sendTestMessage, unlink } from '../services/telegram.js';

// ── /api/settings ───────────────────────────────────────────

export const settingsRouter = Router();

settingsRouter.get('/', (req, res) => {
  res.json(readSettings(authUser(req).id));
});

settingsRouter.patch('/', (req, res) => {
  res.json(patchSettings(authUser(req).id, parse(settingsPatchSchema, req.body)));
});

// ── /api/profile ────────────────────────────────────────────

export const profileRouter = Router();

profileRouter.patch('/', (req, res) => {
  const user = updateProfile(authUser(req).id, parse(profileSchema, req.body));
  res.json({ user: toPublicUser(user) });
});

// ── /api/telegram (сам бот — у папці bot/) ──────────────────

export const telegramRouter = Router();

telegramRouter.post('/link', (req, res) => {
  res.json(createLinkUrl(authUser(req).id));
});

telegramRouter.post('/unlink', (req, res) => {
  res.json(unlink(authUser(req).id));
});

telegramRouter.post('/test', async (req, res) => {
  res.json(await sendTestMessage(authUser(req).id));
});

/** Нагадування про найближчий платіж — надіслати в Telegram прямо зараз. */
telegramRouter.post('/remind-now', async (req, res) => {
  res.json(await sendNearestReminder(authUser(req).id));
});
