import { randomBytes } from 'node:crypto';
import { daysBetween, todayISO } from '../../../shared/dates.js';
import { getSettings } from '../db/settings.js';
import { listSubscriptionDetails } from '../db/subscriptions.js';
import { clearTelegram, findUserById, insertTelegramLinkToken } from '../db/users.js';
import { isoDateTime } from '../db/index.js';
import type { Currency, SettingsDTO, User } from '../types.js';
import { userContext } from './context.js';
import { HttpError, badRequest, conflict, notFound } from './errors.js';
import { nextPayment } from './schedule.js';
import { settingsToDTO } from './settings.js';

/** Telegram на боці сервера */

const LINK_TOKEN_TTL_MIN = 15;
const SEND_TIMEOUT_MS = 10_000;

interface TelegramConfig {
  token: string;
  botName: string;
  apiBase: string;
}

/** Читаємо при кожному виклику (а не при імпорті), щоб зміна .env/середовища не потребувала коду. */
export function telegramConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const botName = process.env.TELEGRAM_BOT_NAME?.trim().replace(/^@/, '');
  if (!token || !botName) return null;
  // TELEGRAM_API_BASE — лише для тестів (підміна api.telegram.org).
  const apiBase = (process.env.TELEGRAM_API_BASE?.trim() || 'https://api.telegram.org').replace(/\/$/, '');
  return { token, botName, apiBase };
}

function requireConfig(): TelegramConfig {
  const cfg = telegramConfig();
  if (!cfg) throw new HttpError(503, 'Telegram-бот не налаштований на сервері');
  return cfg;
}

function userOrThrow(userId: number): User {
  const user = findUserById(userId);
  if (!user) throw notFound('Користувача');
  return user;
}

/** Створює одноразовий токен (TTL 15 хв) і повертає посилання на бота */
export function createLinkUrl(userId: number): { url: string; expires_at: string; settings: SettingsDTO } {
  const cfg = requireConfig();
  userOrThrow(userId);
  // base64url: лише [A-Za-z0-9_-] — саме такі символи Telegram дозволяє в параметрі start (до 64).
  const token = randomBytes(24).toString('base64url');
  const expiresAt = insertTelegramLinkToken(userId, token, LINK_TOKEN_TTL_MIN);
  return {
    url: `https://t.me/${cfg.botName}?start=${token}`,
    expires_at: isoDateTime(expiresAt),
    settings: settingsToDTO(getSettings(userId), userOrThrow(userId)),
  };
}

export function unlink(userId: number): { settings: SettingsDTO } {
  userOrThrow(userId);
  return { settings: settingsToDTO(getSettings(userId), clearTelegram(userId)) };
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  error_code?: number;
}

/** Прив'язаний користувач і конфіг бота, або помилка 503/400. */
function linkedUser(userId: number): { cfg: TelegramConfig; user: User & { telegram_chat_id: number } } {
  const cfg = requireConfig();
  const user = userOrThrow(userId);
  if (user.telegram_chat_id === null) throw badRequest('Спершу прив’яжіть Telegram');
  return { cfg, user: user as User & { telegram_chat_id: number } };
}

function recipient(user: User): string {
  return user.telegram_username ? `@${user.telegram_username}` : 'ваш чат';
}

/** Тестове повідомлення в чат користувача через Bot API sendMessage. */
export async function sendTestMessage(userId: number): Promise<{ ok: true; message: string }> {
  const { cfg, user } = linkedUser(userId);
  const text =
    `✅ Тестове повідомлення Subnetic\n\n` +
    `Привіт, ${user.nickname}! Сповіщення працюють — сюди надходитимуть нагадування про платежі.`;
  await sendMessage(cfg, user.id, user.telegram_chat_id, text);
  return { ok: true, message: `Тестове повідомлення надіслано в ${recipient(user)}.` };
}

// ── Нагадування «зараз» ─────────────────────────────────────

const CURRENCY_SYMBOLS: Record<Currency, string> = { UAH: '₴', USD: '$', EUR: '€' };

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 299 ₴, 11,99 $, 1 250 ₴ — як у боті. */
function formatAmount(amount: number, currency: Currency): string {
  const whole = Math.round(amount * 100) / 100;
  const text = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: Number.isInteger(whole) ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(whole)
    .replace(/\s/g, ' ');
  return `${text} ${CURRENCY_SYMBOLS[currency]}`;
}

function daysWord(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'дні';
  return 'днів';
}

function whenText(days: number): string {
  if (days < 0) return `прострочено на ${-days} ${daysWord(-days)}`;
  if (days === 0) return 'сьогодні';
  if (days === 1) return 'завтра';
  return `через ${days} ${daysWord(days)}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Надсилає зараз нагадування про найближчий платіж (той самий текст, що й у бота).
 * Запис у reminders не створюється — планові нагадування бота від цього не змінюються.
 */
export async function sendNearestReminder(userId: number): Promise<{ ok: true; message: string }> {
  const { cfg, user } = linkedUser(userId);
  const ctx = userContext(userId);
  const next = nextPayment(ctx, listSubscriptionDetails(userId));
  if (!next) throw conflict('Немає активних підписок з найближчим платежем');

  const days = daysBetween(todayISO(), next.date);
  const title = next.trial_end ? '🔔 Закінчується пробний період' : '🔔 Нагадування про платіж';
  const text =
    `<b>${title}</b>\n\n` +
    `<b>${escapeHtml(next.service.name)}</b> · ${escapeHtml(next.plan_name)}\n` +
    `Сума: <b>${formatAmount(next.amount, next.currency)}</b>\n` +
    `Дата списання: ${formatDate(next.date)} (${whenText(days)})`;
  await sendMessage(cfg, user.id, user.telegram_chat_id, text, 'HTML');

  return {
    ok: true,
    message: `Нагадування про ${next.service.name} · ${next.plan_name} (${formatDate(next.date)}) надіслано в ${recipient(user)}.`,
  };
}

// ── Bot API ─────────────────────────────────────────────────

/** sendMessage з перекладом помилок Telegram у зрозумілі HTTP-помилки. */
async function sendMessage(
  cfg: TelegramConfig,
  userId: number,
  chatId: number,
  text: string,
  parseMode?: 'HTML',
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${cfg.apiBase}/bot${cfg.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, ...(parseMode ? { parse_mode: parseMode } : {}) }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch {
    throw new HttpError(502, 'Не вдалося з’єднатися з Telegram. Спробуйте пізніше.');
  }

  let body: TelegramApiResponse | null = null;
  try {
    body = (await res.json()) as TelegramApiResponse;
  } catch {
    // Не JSON — обробимо нижче як помилку.
  }
  if (!res.ok || !body?.ok) {
    const description = body?.description ?? `HTTP ${res.status}`;
    // 403: користувач заблокував бота або ще не натиснув Start.
    if (res.status === 403) {
      throw new HttpError(409, 'Бот не може написати вам: відкрийте чат із ботом і натисніть «Start» (або розблокуйте бота).');
    }
    console.warn(`Telegram sendMessage (user ${userId}) не вдався: ${description}`);
    throw new HttpError(502, `Telegram відхилив повідомлення: ${description}`);
  }
}
