import { useCallback, useEffect, useState } from 'react';
import type { Project, Pagination, ProjectStatus } from '@/types';
import * as projectService from '@/services/projects';
import { ApiRequestError, NetworkError } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

type Status = 'loading' | 'success' | 'error';

export function useProjects(initialLimit = 8, search?: string) {
  const [items, setItems] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | undefined>(undefined);
  const [reloadToken, setReloadToken] = useState(0);
  const { logout } = useAuth();

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  // A new search term invalidates whatever page you were previously on —
  // otherwise typing a search while on page 3 could land on an out-of-range
  // page for the new (likely much smaller) result set.
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    projectService
      .listProjects({ page, limit: initialLimit, status: statusFilter, search }, controller.signal)
      .then((res) => {
        setItems(res.items);
        setPagination(res.pagination);
        setStatus('success');
        // Self-correct if the current page no longer exists (e.g. deleted
        // the last item on the last page) — otherwise the user would see an
        // empty list even though earlier pages still have real projects.
        if (res.pagination.total > 0 && page > res.pagination.totalPages) {
          setPage(res.pagination.totalPages);
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiRequestError && err.statusCode === 401) {
          logout();
          return;
        }
        setError(err instanceof ApiRequestError || err instanceof NetworkError ? err.message : 'Failed to load projects');
        setStatus('error');
      });

    return () => controller.abort();
  }, [page, statusFilter, search, initialLimit, reloadToken, logout]);

  const create = useCallback(
    async (payload: Parameters<typeof projectService.createProject>[0]) => {
      await projectService.createProject(payload);
      setPage(1);
      refetch();
    },
    [refetch]
  );

  const update = useCallback(
    async (id: string, payload: Parameters<typeof projectService.updateProject>[1]) => {
      await projectService.updateProject(id, payload);
      refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      await projectService.deleteProject(id);
      refetch();
    },
    [refetch]
  );

  return {
    items,
    pagination,
    status,
    error,
    page,
    setPage,
    statusFilter,
    setStatusFilter,
    create,
    update,
    remove,
    refetch,
  };
}
