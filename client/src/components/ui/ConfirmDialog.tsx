import { useEffect, useRef } from 'react';
import { Button } from './Button';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  /** Shown when the confirmed action itself fails (e.g. delete rejected by
   * the server) — without this there was nowhere to surface that failure,
   * and the dialog would just silently stop loading with no explanation. */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  isLoading,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }
      // Minimal focus trap: keep Tab/Shift+Tab cycling within the dialog's
      // focusable elements instead of escaping to the page behind the scrim.
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      // Scrim is intentionally raw black/40 in both themes — it dims
      // whatever's behind it rather than following the surface tokens.
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? 'confirm-dialog-description' : undefined}
        tabIndex={-1}
        className="glass-surface glass-surface--elevated w-full max-w-sm p-6"
      >
        <h2 id="confirm-dialog-title" className="text-display-sm text-fg-primary">
          {title}
        </h2>
        {description && (
          <p id="confirm-dialog-description" className="mt-2 text-body-sm text-fg-secondary">
            {description}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-body-sm text-system-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
