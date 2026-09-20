import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { StatusDistributionEntry, DataStatus, ProjectStatus } from '@/types';
import { PROJECT_STATUSES, STATUS_LABELS } from '@/types';
import { Card } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProjectStatusChartProps {
  status: DataStatus;
  data?: StatusDistributionEntry[];
  onRetry?: () => void;
}

/**
 * Centralized status -> color mapping. The actual color values live in
 * index.css as theme-aware CSS custom properties (reusing the same
 * per-status hues already established in Badge.tsx / StatCardsRow.tsx —
 * In Progress=cyan, Completed=green, Overdue=red — plus a new neutral
 * slate for To Do, which had no existing color anywhere). Keeping the
 * lookup here, rather than inline var() strings scattered through the
 * JSX below, means there's exactly one place a status's color is chosen.
 */
const STATUS_COLORS: Record<ProjectStatus, string> = {
  todo: 'var(--status-todo)',
  in_progress: 'var(--status-in-progress)',
  completed: 'var(--status-completed)',
  overdue: 'var(--status-overdue)',
};

interface StatusRow {
  status: ProjectStatus;
  count: number;
  percentage: number;
}

/**
 * Always returns all four statuses, in a fixed order, even when the API
 * payload omits one (defensive only — the real dashboardService.ts
 * aggregation already returns all four with a real 0 count; this just
 * means a future change to that contract can't silently drop a status
 * from the legend).
 *
 * Percentages use largest-remainder rounding rather than rounding each
 * share independently: independent rounding can drift a point or two off
 * 100 once several statuses are involved, and the requirement is that
 * the displayed percentages sum to exactly 100.
 */
function buildRows(distribution: StatusDistributionEntry[] | undefined): StatusRow[] {
  const counts = new Map<ProjectStatus, number>(distribution?.map((d) => [d.status, d.count] as const));
  const base = PROJECT_STATUSES.map((s) => ({ status: s, count: counts.get(s) ?? 0 }));
  const total = base.reduce((sum, r) => sum + r.count, 0);

  if (total === 0) {
    return base.map((r) => ({ ...r, percentage: 0 }));
  }

  const exact = base.map((r) => (r.count / total) * 100);
  const floors = exact.map(Math.floor);
  const remainder = 100 - floors.reduce((a, b) => a + b, 0);
  const byFraction = exact
    .map((value, i) => ({ i, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);
  const percentages = [...floors];
  for (let k = 0; k < remainder; k++) {
    percentages[byFraction[k].i] += 1;
  }

  return base.map((r, i) => ({ ...r, percentage: percentages[i] }));
}

/**
 * Project Status donut. Data comes from the same GET /api/dashboard/summary
 * payload every other dashboard section already uses — specifically
 * `statusDistribution` (all four statuses with real per-user counts) —
 * no new endpoint and no fabricated data.
 */
export function ProjectStatusChart({ status, data, onRetry }: ProjectStatusChartProps) {
  const rows = useMemo(() => buildRows(data), [data]);
  const total = useMemo(() => rows.reduce((sum, r) => sum + r.count, 0), [rows]);
  // Only non-zero statuses become visible arcs — the legend below still
  // always lists all four (see buildRows), so a 0-count status stays
  // visible as "0 (0%)" there without rendering a zero-width donut wedge.
  const segments = useMemo(() => rows.filter((r) => r.count > 0), [rows]);

  return (
    <Card className="h-full min-w-0" padding="lg">
      <div>
        <h2 className="text-display-sm text-fg-primary">Project Status</h2>
        <p className="text-label-sm text-fg-secondary">Where your projects stand right now</p>
      </div>

      <div className="mt-6 min-h-[176px]">
        {status === 'loading' && <ChartSkeleton />}

        {status === 'error' && (
          <ErrorState message="Couldn't load your project status breakdown." onRetry={onRetry} />
        )}

        {status === 'success' && total === 0 && (
          <EmptyState title="No projects yet" description="Create your first project to see its status here." />
        )}

        {status === 'success' && total > 0 && (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8 xl:flex-col">
            <div
              role="img"
              aria-label={`Project status breakdown, ${total} total project${total === 1 ? '' : 's'}: ${rows
                .map((r) => `${STATUS_LABELS[r.status]} ${r.count} (${r.percentage}%)`)
                .join(', ')}.`}
              className="relative aspect-square w-full max-w-[176px] shrink-0 sm:max-w-[192px]"
            >
              <div aria-hidden="true" className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segments}
                      dataKey="count"
                      nameKey="status"
                      innerRadius="68%"
                      outerRadius="100%"
                      paddingAngle={segments.length > 1 ? 3 : 0}
                      stroke="var(--background-primary)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {segments.map((row) => (
                        <Cell key={row.status} fill={STATUS_COLORS[row.status]} />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Center label — Recharts has no native way to render content
                  inside a donut's hole, so this is a plain absolutely
                  positioned overlay sized to match the chart container. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
              >
                <span className="text-stat-value tabular-nums text-fg-primary">{total}</span>
                <span className="text-label-sm text-fg-secondary">Projects</span>
              </div>
            </div>

            <ul className="flex w-full max-w-[200px] flex-col gap-2.5">
              {rows.map((row) => (
                <li key={row.status} className="flex items-center justify-between gap-3 text-body-sm">
                  <span className="flex min-w-0 items-center gap-2 text-fg-secondary">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: STATUS_COLORS[row.status] }}
                    />
                    <span className="truncate">{STATUS_LABELS[row.status]}</span>
                  </span>
                  <span className="shrink-0 tabular-nums font-medium text-fg-primary">
                    {row.count} <span className="font-normal text-fg-tertiary">({row.percentage}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusTooltip({ active, payload }: { active?: boolean; payload?: { payload: StatusRow }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    // Opaque, same reasoning as RevenueChart's tooltip: this follows the
    // cursor over the donut's own colored segments, so full glass
    // translucency would fight the data it's labeling.
    <div className="glass-surface p-3 text-body-sm" style={{ background: 'var(--background-primary)' }}>
      <p className="flex items-center gap-1.5 font-medium text-fg-primary">
        <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[row.status] }} />
        {STATUS_LABELS[row.status]}
      </p>
      <p className="tabular-nums text-fg-secondary">
        {row.count} project{row.count === 1 ? '' : 's'} · {row.percentage}%
      </p>
    </div>
  );
}
