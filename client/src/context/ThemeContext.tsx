import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'pulseboard-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const updateTheme = useCallback((updater: Theme | ((prev: Theme) => Theme)) => {
    const apply = () => {
      setThemeState(updater);
    };

    // Cross-fade the complete page when the browser supports View Transitions,
    // while retaining the normal React state update as the fallback.
    if ('startViewTransition' in document) {
      (document as Document & {
        startViewTransition?: (callback: () => void) => unknown;
      }).startViewTransition?.(apply);
      return;
    }
    apply();
  }, []);

  const setTheme = useCallback((next: Theme) => updateTheme(next), [updateTheme]);
  const toggleTheme = useCallback(() => {
    updateTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, [updateTheme]);

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
