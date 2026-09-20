import { ListChecks, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DashboardStats, DataStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { DeltaBadge } from '@/components/ui/Badge';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

interface StatCardsProps {
  status: DataStatus;
  stats?: DashboardStats;
  onRetry?: () => void;
}

interface StatDefinition {
  label: string;
  value: string;
  delta: number;
  icon: typeof Layers;
  insight: string;
  /** Icon-chip colors — decorative only (icon on a tinted square), but
   * still routed through real, contrast-verified tokens (index.css), not
   * scattered literals: an earlier version hardcoded raw rgba()/hex here
   * and the theme-polish audit found the cyan one failed contrast in light
   * mode (1.62:1 against its own chip, icons need >=3:1). Green/red reuse
   * the app's existing semantic tint tokens; info/cyan are new tokens
   * added for this fix (there was no blue/cyan in the original palette,
   * and reusing purple for both "Total" and "In Progress" would make
   * their chips indistinguishable at a glance). */
  chipBg: string;
  chipFg: string;
}

/**
 * FR-6: "Stat cards (e.g., Total Projects, Active, Completed, Overdue) pull
 * real aggregated counts from the database — not hardcoded." Exactly the
 * four cards the FRD names — a fifth "Completion Rate" card used to live
 * here too (a reasonable metric, but not one FR-6 asked for, and the FRD
 * task explicitly wants the dashboard kept small/focused on the named
 * cards). Its underlying number (`stats.completionRate`) is still computed
 * server-side and available if you want it back.
 */
function buildStatDefinitions(stats: DashboardStats): StatDefinition[] {
  return [
    {
      label: 'Total Projects',
      value: String(stats.total),
      delta: stats.newThisMonthDeltaPct,
      icon: Layers,
      insight: `${stats.newThisMonthDeltaPct >= 0 ? 'Up' : 'Down'} vs. last month`,
      chipBg: 'var(--background-info-tint)',
      chipFg: 'var(--foreground-info)',
    },
    {
      label: 'In Progress',
      value: String(stats.inProgress),
      delta: stats.total === 0 ? 0 : Math.round((stats.inProgress / stats.total) * 100),
      icon: ListChecks,
      insight: 'Share of active work currently in progress',
      chipBg: 'var(--background-cyan-tint)',
      chipFg: 'var(--foreground-cyan)',
    },
    {
      label: 'Completed',
      value: String(stats.completed),
      delta: stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100),
      icon: CheckCircle2,
      insight: 'Share of all projects marked done',
      chipBg: 'var(--background-success-tint)',
      chipFg: 'var(--foreground-success)',
    },
    {
      label: 'Overdue',
      value: String(stats.overdue),
      delta: stats.overdue === 0 ? 0 : -Math.round((stats.overdue / stats.total) * 100),
      icon: AlertTriangle,
      insight: 'Needs attention — past their due date',
      chipBg: 'var(--background-danger-tint)',
      chipFg: 'var(--foreground-danger)',
    },
  ];
}

export function StatCardsRow({ status, stats, onRetry }: StatCardsProps) {
  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        <span className="sr-only">Loading dashboard statistics…</span>
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (status === 'error' || !stats) {
    return <ErrorState message="Couldn't load your dashboard statistics." onRetry={onRetry} />;
  }

  const definitions = buildStatDefinitions(stats);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {definitions.map((stat) => {
        const Icon = stat.icon;
        return (
          // Plain informational card — FR-6 only asks these pull real
          // aggregated counts (see the block comment above), not that they
          // navigate anywhere. No FR/Figma reference specifies click-to-
          // Recent-Activity behavior, so it isn't added here; Card's
          // `interactive`/`onClick` combo remains available for the day a
          // requirement actually calls for it.
          <Card key={stat.label} className="min-w-0">
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-secondary"
              style={{ background: stat.chipBg, color: stat.chipFg }}
            >
              <Icon size={20} />
            </div>
            <p className="mt-4 text-stat-value tabular-nums text-fg-primary">{stat.value}</p>
            <p className="text-body-sm text-fg-secondary">{stat.label}</p>
            <div className="mt-3 flex items-center gap-2 text-label-sm text-fg-tertiary">
              <DeltaBadge value={stat.delta} />
              <span className="truncate">{stat.insight}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
