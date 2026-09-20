import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ProjectActivityPoint, DataStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { ChartSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

interface RevenueChartProps {
  status: DataStatus;
  data?: ProjectActivityPoint[];
  onRetry?: () => void;
}

/**
 * FR-7: "One chart (line or bar) visualizes projects created/completed
 * over time, computed from actual records." Plots exactly that — Created
 * and Completed per month (both real fields already returned by
 * dashboardService.ts's aggregation). No other series.
 *
 * Previously also plotted a cumulative "Total" line, plus (earlier still)
 * an Overdue bar and a dashed "Forecast" projection — none of those are in
 * FR-7's scope, which asks for created/completed over time specifically,
 * not a running total, an at-risk count, or a projection. Removed rather
 * than left in, per the FRD task's "keep it small and focused" instruction.
 * The server still computes `total` (in `ProjectActivityPoint`) and
 * `forecastNext` — neither was touched, since the fix needed here was "stop
 * plotting this," not "stop computing it," and changing what the API
 * returns would be a bigger, unnecessary change to the aggregation itself.
 */
export function RevenueChart({ status, data, onRetry }: RevenueChartProps) {
  const rows = useMemo(() => data ?? [], [data]);

  return (
    <Card className="h-full min-w-0" padding="lg">
      <div>
        <h2 className="text-display-sm text-fg-primary">Project Activity</h2>
        <p className="text-label-sm text-fg-secondary">Created vs. completed, last 12 months</p>
      </div>

      <div className="mt-6 h-72 min-w-0">
        {status === 'loading' && <ChartSkeleton />}
        {status === 'error' && <ErrorState message="Couldn't load the activity chart." onRetry={onRetry} />}
        {status === 'success' && rows.length === 0 && (
          <EmptyState title="No activity yet" description="Create your first project to see trends here." />
        )}
        {status === 'success' && rows.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid vertical={false} stroke="var(--border-bounds)" />
              <XAxis
                dataKey="month"
                tick={{ fill: 'var(--foreground-secondary)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--border-bounds)' }}
                tickLine={false}
              />
              <YAxis
                // Project counts are always whole numbers — without this,
                // Recharts' default tick generator can label the axis with
                // fractional ticks (0, 0.5, 1, 1.5 ...) when the max value
                // is small, which reads as malformed for count data.
                allowDecimals={false}
                tick={{ fill: 'var(--foreground-secondary)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--background-quaternary)' }} />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'var(--foreground-secondary)' }}
                formatter={(value) => <span style={{ color: 'var(--foreground-secondary)' }}>{value}</span>}
              />
              <Bar dataKey="created" name="Created" fill="var(--chart-created)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="var(--chart-completed)"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    // Opaque, same reasoning as Topbar's dropdown popovers: this tooltip
    // follows the cursor over the chart's own colored bars/lines with no
    // scrim behind it, so full glass translucency would fight the very
    // data it's labeling instead of sitting cleanly on top of it.
    <div className="glass-surface p-3 text-body-sm" style={{ background: 'var(--background-primary)' }}>
      <p className="mb-1 font-medium text-fg-primary">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="flex items-center justify-between gap-6 text-fg-secondary">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="tabular-nums font-medium text-fg-primary">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}
