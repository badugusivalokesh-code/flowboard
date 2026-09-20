import type { ProjectStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

// Tint backgrounds route through the theme-aware background-*-tint tokens
// (index.css) rather than inline rgba() — those literal values were a real
// token-system bypass found during the Phase 2 audit, and their light-mode
// numbers didn't work as a dark-mode background either.
const STYLES: Record<ProjectStatus, string> = {
  todo: 'bg-bg-quaternary text-fg-secondary',
  in_progress: 'bg-[var(--background-tips-informative)] text-brand-text',
  completed: 'bg-[var(--background-success-tint)] text-system-success',
  overdue: 'bg-[var(--background-danger-tint)] text-system-danger',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-label-sm2 font-semibold ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// Solid-fill pills (white text on a saturated color), matching the Figma
// reference's "+10%" / "-8%" delta chips. Uses the *-solid tokens, which are
// verified 5+:1 with white text — the raw system-success/danger hues fail
// that check (see Phase 2 report).
export function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-label-sm2 font-semibold tabular-nums text-white ${
        positive ? 'bg-system-success-solid' : 'bg-system-danger-solid'
      }`}
    >
      {positive ? '▲' : '▼'} {Math.abs(value)}%
    </span>
  );
}
