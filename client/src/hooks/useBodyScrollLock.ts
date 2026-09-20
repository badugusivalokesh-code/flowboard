import { useEffect } from 'react';

/**
 * Locks page scroll while `isOpen` is true — for any overlay (drawer,
 * dialog, modal form). Without this, the dashboard content underneath a
 * fixed-position overlay stays scrollable via wheel/touch, which reads as
 * a confusing "double scroll" and was a real gap (nothing in the app
 * locked scroll before this).
 *
 * Sets it on `document.body` rather than the app's internal scroll
 * container specifically because that's the one thing guaranteed to stop
 * ALL page scroll regardless of which container is scrollable in a given
 * layout — including iOS Safari's rubber-band/bounce scroll, which can
 * still move the viewport even when every element has its own
 * `overflow-y-auto` correctly set.
 */
export function useBodyScrollLock(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
}
