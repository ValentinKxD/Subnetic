import type { ZodType, ZodTypeDef } from 'zod';
import { clearToken, getToken } from '@/lib/token';

/** Помилка відповіді API: HTTP-статус, загальне повідомлення та помилки полів `{error, fields}`. */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;
  readonly body: unknown;

  constructor(status: number, message: string, fields: Record<string, string>, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
    this.body = body;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions<T> {
  method?: HttpMethod;
  body?: unknown;
  /** zod-схема для перевірки відповіді (рекомендовано). */
  schema?: ZodType<T, ZodTypeDef, unknown>;
  signal?: AbortSignal;
  /**
   * Не перенаправляти на /login при 401 (токен однаково очищається). Потрібно для
   * запитів автентифікації (перевірка сесії, невдалий вхід), де 401 — очікувана відповідь.
   */
  skipAuthRedirect?: boolean;
}

const API_BASE = '/api';
export const LOGIN_PATH = '/login';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function extractMessage(body: unknown, fallback: string): string {
  return isRecord(body) && typeof body.error === 'string' ? body.error : fallback;
}

function extractFields(body: unknown): Record<string, string> {
  if (!isRecord(body) || !isRecord(body.fields)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.fields)) {
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

function redirectToLogin(): void {
  if (window.location.pathname === LOGIN_PATH) return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`${LOGIN_PATH}?next=${next}`);
}

/** Єдина точка звернення до API: JSON, токен Bearer, обробка 401. */
export async function apiRequest<T>(path: string, options: RequestOptions<T> = {}): Promise<T> {
  const { method = 'GET', body, schema, signal, skipAuthRedirect = false } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'Сервер недоступний. Перевірте з’єднання.', {}, null);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (res.status === 401) {
    // Токен недійсний (вийшли, сервер перезапустився тощо) — прибираємо його.
    clearToken();
    if (!skipAuthRedirect) redirectToLogin();
    throw new ApiError(401, extractMessage(data, 'Потрібна авторизація'), extractFields(data), data);
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      extractMessage(data, `Помилка запиту (${res.status})`),
      extractFields(data),
      data,
    );
  }

  return schema ? schema.parse(data) : (data as T);
}

type Opts<T> = Omit<RequestOptions<T>, 'method' | 'body'>;

export const api = {
  get: <T>(path: string, opts?: Opts<T>) => apiRequest<T>(path, opts),
  post: <T>(path: string, body?: unknown, opts?: Opts<T>) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts?: Opts<T>) =>
    apiRequest<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts?: Opts<T>) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: Opts<T>) => apiRequest<T>(path, { ...opts, method: 'DELETE' }),
};
