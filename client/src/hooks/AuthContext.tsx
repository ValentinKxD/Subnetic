import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LoginData, PublicUser, RegisterData } from '@shared/auth';
import * as authApi from '@/api/endpoints';

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
  // Сесійна кука httpOnly — JS її не бачить, тож стан сесії дізнаємось лише запитом /me.
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const ctrl = new AbortController();
    authApi
      .fetchMe(ctrl.signal)
      .then((u) => {
        setUser(u);
        setStatus('authenticated');
      })
      .catch(() => {
        if (ctrl.signal.aborted) return;
        // Сесії немає або вона минула (401) — користувач гість.
        setUser(null);
        setStatus('guest');
      });
    return () => ctrl.abort();
  }, []);

  const login = useCallback(async (data: LoginData) => {
    // «Запам'ятати мене» передається серверу: він задає термін дії куки.
    const res = await authApi.login(data);
    setUser(res.user);
    setStatus('authenticated');
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    // Після реєстрації сервер відкриває сесію як при вході без «Запам'ятати мене».
    const res = await authApi.register(data);
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
