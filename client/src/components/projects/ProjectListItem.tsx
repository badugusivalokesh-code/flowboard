import { Pencil, Trash2, CalendarDays } from 'lucide-react';
import type { Project } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ProjectListItem({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const due = formatDate(project.dueDate);

  return (
    <Card interactive className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 truncate text-body-md font-medium text-fg-primary">{project.title}</h3>
            <StatusBadge status={project.status} />
          </div>
          {project.description && (
            <p className="mt-1.5 line-clamp-2 text-body-sm text-fg-secondary">{project.description}</p>
          )}
          {due && (
            <p className="mt-2 flex items-center gap-1.5 text-label-sm text-fg-tertiary">
              <CalendarDays size={14} aria-hidden="true" />
              Due {due}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${project.title}`}
            className="rounded-secondary p-2 text-fg-secondary transition-colors duration-150 hover:bg-bg-quaternary hover:text-fg-primary active:scale-90"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${project.title}`}
            className="rounded-secondary p-2 text-fg-secondary transition-colors duration-150 hover:bg-[var(--background-danger-tint)] hover:text-system-danger active:scale-90"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
