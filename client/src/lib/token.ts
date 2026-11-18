/**
 * Зберігання токена сесії.
 * «Запам'ятати мене» → localStorage (переживає закриття браузера),
 * інакше → sessionStorage (живе, поки відкрита вкладка; оновлення сторінки його не стирає).
 */
const TOKEN_KEY = 'subnetic-token';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    // Сховище може бути недоступне (приватний режим, заборона cookies/storage).
    return fallback;
  }
}

export function getToken(): string | null {
  return safe(() => localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY), null);
}

export function setToken(token: string, remember: boolean): void {
  safe(() => {
    clearToken();
    (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
  }, undefined);
}

export function clearToken(): void {
  safe(() => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }, undefined);
}
