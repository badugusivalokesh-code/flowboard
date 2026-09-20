import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import * as authService from '@/services/auth';
import { ApiRequestError, NetworkError } from '@/services/api';

interface AuthContextValue {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [error, setError] = useState<string | null>(null);

  // Rehydrate session on refresh via the httpOnly cookie.
  useEffect(() => {
    let cancelled = false;
    authService
      .fetchCurrentUser()
      .then(({ user: current }) => {
        if (!cancelled) {
          setUser(current);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setStatus('unauthenticated');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { user: loggedIn } = await authService.login({ email, password });
      setUser(loggedIn);
      setStatus('authenticated');
    } catch (err) {
      const message = err instanceof ApiRequestError || err instanceof NetworkError ? err.message : 'Unable to log in right now';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    try {
      const { user: created } = await authService.register({ name, email, password });
      setUser(created);
      setStatus('authenticated');
    } catch (err) {
      const message = err instanceof ApiRequestError || err instanceof NetworkError ? err.message : 'Unable to create your account right now';
      setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({ user, status, error, login, register, logout, clearError }),
    [user, status, error, login, register, logout, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
