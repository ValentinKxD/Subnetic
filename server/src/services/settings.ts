import type { SettingsPatch } from '../../../shared/domain.js';
import { getSettings, updateSettings } from '../db/settings.js';
import { findUserById } from '../db/users.js';
import { isoDateTime } from '../db/index.js';
import type { Settings, SettingsDTO, User } from '../types.js';
import { notFound } from './errors.js';
import { telegramConfig } from './telegram.js';

export function settingsToDTO(s: Settings, user: User): SettingsDTO {
  const tg = telegramConfig();
  return {
    currency: s.currency,
    theme: s.theme,
    remind_7: s.remind_7,
    remind_3: s.remind_3,
    remind_1: s.remind_1,
    remind_hour: s.remind_hour,
    telegram: {
      configured: tg !== null,
      bot_name: tg?.botName ?? null,
      linked: user.telegram_chat_id !== null,
      username: user.telegram_username,
      linked_at: isoDateTime(user.telegram_linked_at),
    },
  };
}

function userOrThrow(userId: number): User {
  const user = findUserById(userId);
  if (!user) throw notFound('Користувача');
  return user;
}

export function readSettings(userId: number): SettingsDTO {
  return settingsToDTO(getSettings(userId), userOrThrow(userId));
}

export function patchSettings(userId: number, patch: SettingsPatch): SettingsDTO {
  return settingsToDTO(updateSettings(userId, patch), userOrThrow(userId));
}
