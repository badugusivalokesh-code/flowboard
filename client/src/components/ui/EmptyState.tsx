import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
      {/* Icon sits in a quiet tinted chip (same language as the stat-card
          icon chips) rather than floating bare — gives an otherwise
          content-free state a bit of visual structure instead of reading
          like an unfinished placeholder. Falls back to a plain dot so an
          EmptyState without an explicit icon still isn't just two lines of
          text at the top of a large empty area. */}
      <div
        aria-hidden="true"
        className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-bg-quaternary text-fg-tertiary"
      >
        {icon ?? <span className="h-2 w-2 rounded-full bg-current" />}
      </div>
      <p className="text-body-md font-medium text-fg-primary">{title}</p>
      {description && <p className="max-w-xs text-body-sm text-fg-secondary">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
