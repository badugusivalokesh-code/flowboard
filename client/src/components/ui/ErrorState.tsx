import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-1.5 rounded-secondary bg-tips-danger px-4 py-10 text-center"
    >
      <div
        aria-hidden="true"
        className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--background-danger-tint)] text-system-danger"
      >
        <AlertTriangle size={22} />
      </div>
      <p className="text-body-md font-medium text-system-danger">Something went wrong</p>
      <p className="max-w-xs text-body-sm text-fg-secondary">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-3">
          Try again
        </Button>
      )}
    </div>
  );
}
