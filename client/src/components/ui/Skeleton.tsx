import type { CSSProperties } from 'react';

export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-secondary bg-bg-quaternary ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-surface p-5">
      <Skeleton className="h-10 w-10 rounded-secondary" />
      <Skeleton className="mt-4 h-8 w-20" />
      <Skeleton className="mt-2 h-4 w-24" />
      <Skeleton className="mt-3 h-4 w-full" />
    </div>
  );
}

/** Bare skeleton content only — every caller (RevenueChart, ProjectStatusChart)
 * already renders this inside its own `<Card>`, so this previously wrapping
 * itself in a second `.glass-surface` produced a card nested inside a card
 * while loading: doubled blur/border/shadow and mismatched padding against
 * the real (post-load) chart content, which sits directly in the outer
 * Card's padding with no surface of its own. Matches TableRowSkeleton's
 * pattern (also always used inside an existing Card) for consistency. */
export function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-32" />
      <div className="flex h-40 items-end gap-2">
        {[40, 65, 50, 80, 60, 45].map((h, i) => (
          <Skeleton key={i} className="w-full" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-16 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}
