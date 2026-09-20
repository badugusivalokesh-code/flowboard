import { useCallback, useEffect, useState } from 'react';

/** Small shared open/close state for the mobile sidebar drawer, plus the
 * couple of accessibility behaviors every drawer needs: Escape closes it,
 * and route/section changes close it automatically. */
export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  return { isOpen, open, close, toggle };
}
