import type { SettingsValues } from '../../../shared/domain.js';
import type { Currency, Settings } from '../types.js';
import { bool, sql } from './index.js';

/** Доступ до user_settings. */

interface SettingsRow extends Omit<Settings, 'remind_7' | 'remind_3' | 'remind_1'> {
  remind_7: number;
  remind_3: number;
  remind_1: number;
}

export function getSettings(userId: number): Settings {
  // Рядок налаштувань створюється разом із користувачем; INSERT OR IGNORE — страховка для старих акаунтів.
  sql(`INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)`).run(userId);
  const row = sql(
    `SELECT user_id, currency, theme, remind_7, remind_3, remind_1, remind_hour FROM user_settings WHERE user_id = ?`,
  ).get(userId) as SettingsRow;
  return { ...row, remind_7: bool(row.remind_7), remind_3: bool(row.remind_3), remind_1: bool(row.remind_1) };
}

const SETTINGS_KEYS = ['currency', 'theme', 'remind_7', 'remind_3', 'remind_1', 'remind_hour'] as const;

export function updateSettings(userId: number, patch: Partial<SettingsValues>): Settings {
  const sets: string[] = [];
  const params: Record<string, string | number> = { user_id: userId };
  for (const key of SETTINGS_KEYS) {
    const value = patch[key];
    if (value === undefined) continue;
    sets.push(`${key} = @${key}`);
    params[key] = typeof value === 'boolean' ? Number(value) : value;
  }
  getSettings(userId);
  if (sets.length > 0) sql(`UPDATE user_settings SET ${sets.join(', ')} WHERE user_id = @user_id`).run(params);
  return getSettings(userId);
}

export function getUserCurrency(userId: number): Currency {
  return getSettings(userId).currency;
}

