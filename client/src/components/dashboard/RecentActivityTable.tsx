import { useNavigate } from 'react-router-dom';
import type { RecentActivityEntry, DataStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

interface RecentActivityTableProps {
  status: DataStatus;
  items?: RecentActivityEntry[];
  onRetry?: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function RecentActivityTable({ status, items, onRetry }: RecentActivityTableProps) {
  const navigate = useNavigate();

  return (
    <Card className="min-w-0" padding="lg">
      <h2 className="text-display-sm text-fg-primary">Recent Activity</h2>
      <p className="text-label-sm text-fg-secondary">Your most recently updated projects</p>

      {status === 'loading' && (
        <div className="mt-4 divide-y divide-border-bounds" aria-busy="true">
          <span className="sr-only">Loading recent activity…</span>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      )}

      {status === 'error' && (
        <div className="mt-4">
          <ErrorState message="Couldn't load recent activity." onRetry={onRetry} />
        </div>
      )}

      {status === 'success' && (!items || items.length === 0) && (
        <div className="mt-4">
          <EmptyState
            title="No activity yet"
            description="Updates to your projects will show up here."
            action={
              <Button size="sm" onClick={() => navigate('/dashboard/projects')}>
                Create your first project
              </Button>
            }
          />
        </div>
      )}

      {status === 'success' && items && items.length > 0 && (
        <>
          {/* Desktop/tablet: real table */}
          <table className="mt-4 hidden w-full min-w-0 text-left sm:table">
            <caption className="sr-only">Recently updated projects</caption>
            <thead>
              <tr className="text-label-sm text-fg-secondary">
                <th scope="col" className="pb-2 font-normal">Project</th>
                <th scope="col" className="pb-2 font-normal">Status</th>
                <th scope="col" className="pb-2 font-normal">Due</th>
                <th scope="col" className="pb-2 font-normal">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-bounds">
              {items.map((item) => (
                <tr key={item.id} className="text-body-sm">
                  <td className="max-w-0 truncate py-3 pr-4 text-fg-primary">{item.title}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-3 pr-4 text-fg-secondary">{formatDate(item.dueDate)}</td>
                  <td className="py-3 text-fg-secondary">{formatDate(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile: card list */}
          <ul className="mt-4 flex flex-col divide-y divide-border-bounds sm:hidden">
            {items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-body-sm font-medium text-fg-primary">{item.title}</p>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-label-sm text-fg-secondary">
                  <span>Due {formatDate(item.dueDate)}</span>
                  <span aria-hidden="true">·</span>
                  <span>Updated {formatDate(item.updatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
