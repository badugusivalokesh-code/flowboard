import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, SearchX } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { ApiRequestError } from '@/services/api';
import type { Project, ProjectStatus } from '@/types';
import { PROJECT_STATUSES, STATUS_LABELS } from '@/types';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProjectListItem } from '@/components/projects/ProjectListItem';
import { ProjectFormModal, type ProjectFormValues } from '@/components/projects/ProjectFormModal';

export default function Projects() {
  // The search box itself lives in Topbar (shared across the dashboard
  // shell) and drives this same `q` URL param — see Topbar's
  // ProjectSearchInput for why it's wired that way.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';

  const { items, pagination, status, error, page, setPage, statusFilter, setStatusFilter, create, update, remove } =
    useProjects(8, search || undefined);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function clearSearch() {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete('q');
        return params;
      },
      { replace: true }
    );
  }

  function openCreate() {
    setFormMode('create');
    setEditingProject(null);
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setFormMode('edit');
    setEditingProject(project);
    setFormOpen(true);
  }

  async function handleFormSubmit(values: ProjectFormValues) {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      status: values.status,
      dueDate: values.dueDate ? values.dueDate : null,
    };
    if (formMode === 'create') {
      await create(payload);
    } else if (editingProject) {
      await update(editingProject._id, payload);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await remove(deleteTarget._id);
      setDeleteTarget(null);
    } catch (err) {
      // Previously uncaught — a failed delete (404 if it's already gone,
      // 500, network) would fail silently with no feedback at all.
      setDeleteError(err instanceof ApiRequestError ? err.message : 'Failed to delete this project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Container className="flex flex-col gap-6 py-6">
      {/* One toolbar row: title/context on the left, every control (status
          filter + New project) grouped together on the right — previously
          the filter sat in its own disconnected row below the header, which
          read as two unrelated pieces of UI rather than one toolbar. */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-display-md text-fg-primary">Projects</h1>
          {search ? (
            <p className="text-body-sm text-fg-secondary">
              Showing results for <span className="font-medium text-fg-primary">"{search}"</span> —{' '}
              <button type="button" onClick={clearSearch} className="text-brand-text hover:underline">
                clear
              </button>
            </p>
          ) : (
            <p className="text-body-sm text-fg-secondary">Everything you're tracking, in one place.</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter ?? ''}
            onChange={(e) => {
              setStatusFilter((e.target.value || undefined) as ProjectStatus | undefined);
              setPage(1);
            }}
            className="h-11 rounded-secondary border border-border-glass-secondary bg-bg-secondary px-3 text-body-md text-fg-primary backdrop-blur-glass transition-colors duration-150 hover:border-border-glass focus-visible:border-brand"
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <Button onClick={openCreate} className="shrink-0 gap-1.5">
            <Plus size={16} aria-hidden="true" />
            New project
          </Button>
        </div>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col gap-4" aria-busy="true">
          <span className="sr-only">Loading projects…</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {status === 'error' && <ErrorState message={error ?? 'Failed to load projects.'} />}

      {status === 'success' && items.length === 0 && search && (
        <EmptyState
          icon={<SearchX size={28} aria-hidden="true" />}
          title="No matching projects"
          description={`Nothing matches "${search}". Try a different search, or clear it to see everything.`}
          action={
            <Button variant="secondary" onClick={clearSearch}>
              Clear search
            </Button>
          }
        />
      )}

      {status === 'success' && items.length === 0 && !search && (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking it on your dashboard."
          action={<Button onClick={openCreate}>New project</Button>}
        />
      )}

      {status === 'success' && items.length > 0 && (
        <div className="flex flex-col gap-4">
          {items.map((project) => (
            <ProjectListItem
              key={project._id}
              project={project}
              onEdit={() => openEdit(project)}
              onDelete={() => {
                setDeleteError(null);
                setDeleteTarget(project);
              }}
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <span className="tabular-nums text-body-sm text-fg-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <ProjectFormModal
        open={formOpen}
        mode={formMode}
        project={editingProject}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this project?"
        description={
          deleteTarget ? `"${deleteTarget.title}" will be permanently deleted. This can't be undone.` : undefined
        }
        confirmLabel="Delete"
        isLoading={isDeleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </Container>
  );
}
