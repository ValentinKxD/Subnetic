import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginData, PublicUser, RegisterData } from '@shared/auth';
import * as authApi from '@/api/endpoints';
import { clearToken, getToken, setToken } from '@/lib/token';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  login: (data: LoginData) => Promise<PublicUser>;
  register: (data: RegisterData) => Promise<PublicUser>;
  logout: () => Promise<void>;
  /** Оновити дані користувача після зміни профілю. */
  updateUser: (user: PublicUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  // Без токена одразу «гість» — запит /me не потрібен.
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? 'loading' : 'guest'));

  useEffect(() => {
    if (!getToken()) return;
    const ctrl = new AbortController();
    authApi
      .fetchMe(ctrl.signal)
      .then((u) => {
        setUser(u);
        setStatus('authenticated');
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        // Токен недійсний (наприклад, сервер перезапустився): api-клієнт уже очистив його при 401.
        setUser(null);
        setStatus('guest');
      });
    return () => ctrl.abort();
  }, []);

  const login = useCallback(async (data: LoginData) => {
    const res = await authApi.login(data);
    setToken(res.token, data.remember);
    setUser(res.user);
    setStatus('authenticated');
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    // Після реєстрації — як вхід без «Запам'ятати мене».
    setToken(res.token, false);
    setUser(res.user);
    setStatus('authenticated');
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Навіть якщо сервер недоступний, локально виходимо.
    } finally {
      clearToken();
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout, updateUser: setUser }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth має використовуватися всередині <AuthProvider>');
  return ctx;
}
