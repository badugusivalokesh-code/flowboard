import { useEffect, useRef, type ReactNode } from 'react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export function MobileDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useBodyScrollLock(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Keep the closed drawer fully out of the tab order and accessibility
  // tree — it's translated off-screen rather than unmounted (so the close
  // transition still plays), and aria-hidden/pointer-events-none alone
  // don't stop keyboard focus from reaching its off-screen content.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (isOpen) {
      panel.removeAttribute('inert');
    } else {
      panel.setAttribute('inert', '');
    }
  }, [isOpen]);

  // Same focus-trap pattern as ConfirmDialog/ProjectFormModal: move focus
  // into the drawer on open, keep Tab cycling within it, and restore focus
  // to whatever opened it (the "Open menu" button) on close. Escape-to-
  // close is already handled globally in useDrawer.
  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
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
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-40 md:hidden ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        tabIndex={-1}
        className={`glass-surface glass-surface--elevated absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-hidden rounded-none transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--background-primary)' }}
      >
        {children}
      </div>
    </div>
  );
}
