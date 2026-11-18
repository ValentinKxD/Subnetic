import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SettingsPatch } from '@shared/domain';
import { getSettings, patchSettings } from '@/api/endpoints';
import type { Currency, Settings, Theme } from '@/lib/types';
import { useTheme } from './ThemeContext';

interface SettingsContextValue {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  /** Валюта відображення (до завантаження налаштувань — UAH). */
  currency: Currency;
  /** Оптимістичне оновлення: застосовує одразу, при помилці відкочує і кидає далі. */
  update: (patch: SettingsPatch) => Promise<Settings>;
  /** Замінити налаштування відповіддю сервера (напр., після прив'язки Telegram). */
  replace: (s: Settings) => void;
  setTheme: (theme: Theme) => void;
  reload: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/**
 * Налаштування користувача для захищеної частини застосунку.
 * Тема з сервера має пріоритет над localStorage; перемикання теми зберігається в обох.
 * Зміна валюти змінює `currency`, і хуки даних перезавантажуються з новою валютою.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { setTheme: applyTheme } = useTheme();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(null);
    getSettings(ctrl.signal)
      .then((s) => {
        setSettings(s);
        applyTheme(s.theme);
      })
      .catch((e: unknown) => {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : 'Не вдалося завантажити налаштування');
      });
    return () => ctrl.abort();
  }, [applyTheme, tick]);

  const update = useCallback(
    async (patch: SettingsPatch) => {
      const prev = settings;
      if (prev) setSettings({ ...prev, ...patch });
      if (patch.theme) applyTheme(patch.theme);
      try {
        const next = await patchSettings(patch);
        setSettings(next);
        return next;
      } catch (e) {
        setSettings(prev);
        if (patch.theme && prev) applyTheme(prev.theme);
        throw e;
      }
    },
    [settings, applyTheme],
  );

  const setTheme = useCallback(
    (theme: Theme) => {
      update({ theme }).catch(() => {
        // Тема вже застосована локально; помилку збереження на сервері не показуємо окремо.
        applyTheme(theme);
      });
    },
    [update, applyTheme],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loading: settings === null && error === null,
      error,
      currency: settings?.currency ?? 'UAH',
      update,
      replace: setSettings,
      setTheme,
      reload: () => setTick((t) => t + 1),
    }),
    [settings, error, update, setTheme],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings має використовуватися всередині <SettingsProvider>');
  return ctx;
}
