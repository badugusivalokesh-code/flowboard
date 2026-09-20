import { useCallback, useEffect, useState } from 'react';
import type { DashboardSummary } from '@/types';
import { fetchDashboardSummary } from '@/services/dashboard';
import { ApiRequestError, NetworkError } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

type Status = 'loading' | 'success' | 'error';

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const { logout } = useAuth();

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);

    fetchDashboardSummary(controller.signal)
      .then((summary) => {
        setData(summary);
        setStatus('success');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        // A 401 here means the session expired mid-use (not just "never
        // logged in") — flip global auth state so ProtectedRoute redirects,
        // instead of leaving the user staring at a dashboard-shaped error.
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiRequestError || err instanceof NetworkError ? err.message : 'Failed to load dashboard data');
        setStatus('error');
      });

    return () => controller.abort();
  }, [reloadToken, logout]);

  return { data, status, error, refetch };
}
