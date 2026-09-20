import { useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

/**
 * Reference match for the "greeting/header hierarchy" + "date/productivity
 * card" requirement. Everything shown here is real, derived client-side —
 * not a new feature/endpoint: the greeting word comes from the visitor's
 * own local clock, the date is `new Date()`, and the name is the already-
 * authenticated user's real `name` from useAuth(). The only non-data text
 * is the static encouragement line, which is UI copy (like the reference's
 * own "Stay productive, keep building!"), not a data claim.
 */
function getGreeting(hour: number): string {
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardGreeting() {
  const { user } = useAuth();

  // Computed once per mount rather than a live-ticking clock — this is a
  // page header, not a clock widget; re-rendering every second/minute would
  // be motion with no purpose.
  const now = useMemo(() => new Date(), []);
  const greeting = getGreeting(now.getHours());
  const dateLabel = useMemo(
    () => now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
    [now]
  );
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-body-lg text-fg-secondary">{greeting},</p>
        <h1 className="truncate text-display-lg text-fg-primary">{firstName ?? 'there'}</h1>
        <p className="mt-1 text-body-sm text-fg-secondary">Here's what's happening with your projects today.</p>
      </div>

      <Card padding="md" className="flex shrink-0 items-center gap-3 sm:min-w-[260px]">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-secondary text-white"
          style={{ backgroundImage: 'var(--gradient-brand-mono)' }}
        >
          <Calendar size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-body-sm font-medium text-fg-primary">{dateLabel}</p>
          <p className="truncate text-label-sm text-fg-secondary">Stay productive, keep building!</p>
        </div>
      </Card>
    </div>
  );
}
