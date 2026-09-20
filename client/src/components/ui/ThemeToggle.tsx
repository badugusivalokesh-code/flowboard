import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className="relative flex h-9 w-16 items-center rounded-full border border-border-glass-secondary bg-bg-secondary px-1 backdrop-blur-glass transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-border-glass active:scale-95"
    >
      <span
        // Intentionally raw white, like Button's primary/danger text above —
        // the knob needs to read against the track in both themes, not
        // follow it.
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-white text-body-md shadow-card transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
        aria-hidden="true"
      >
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
