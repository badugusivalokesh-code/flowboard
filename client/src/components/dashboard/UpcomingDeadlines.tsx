import { CalendarClock } from 'lucide-react';
import type { UpcomingDeadlineEntry, DataStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function UpcomingDeadlines({
  status,
  items,
  onRetry,
}: {
  status: DataStatus;
  items?: UpcomingDeadlineEntry[];
  onRetry?: () => void;
}) {
  return (
    <Card className="min-w-0" padding="lg">
      <h2 className="text-display-sm text-fg-primary">Upcoming Deadlines</h2>
      <p className="text-label-sm text-fg-secondary">Your soonest-due active projects</p>

      {status === 'loading' && (
        <div className="mt-4 divide-y divide-border-bounds" aria-busy="true">
          <span className="sr-only">Loading upcoming deadlines…</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4">
          <ErrorState message="Couldn't load upcoming deadlines." onRetry={onRetry} />
        </div>
      )}

      {status === 'success' && (!items || items.length === 0) && (
        <div className="mt-4">
          <EmptyState
            icon={<CalendarClock size={28} aria-hidden="true" />}
            title="Nothing due soon"
            description="Active projects with a due date will show up here."
          />
        </div>
      )}

      {status === 'success' && items && items.length > 0 && (
        <ul className="mt-4 flex flex-col divide-y divide-border-bounds">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
              <p className="min-w-0 truncate text-body-sm text-fg-primary">{item.title}</p>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={item.status} />
                <span className="text-label-sm text-fg-secondary">{formatDate(item.dueDate)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
