import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, Bell, Menu, LogOut, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';

function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  // Real, if simple, state: the dot shows until the panel has been opened
  // once, then clears — the same pattern most apps use for "seen" vs
  // "unseen," rather than an unread indicator that never means anything.
  const [hasUnread, setHasUnread] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        // Keyboard users tabbing away should close this too, not just
        // Escape/click-outside — nothing inside the popover is focusable,
        // so losing focus means focus has left the whole control.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((v) => !v);
          setHasUnread(false);
        }}
        className="relative rounded-full p-2.5 text-fg-secondary transition-colors duration-150 hover:bg-bg-quaternary hover:text-fg-primary active:scale-90"
      >
        <Bell size={18} />
        {hasUnread && (
          <span aria-hidden="true" className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-system-danger-solid" />
        )}
      </button>
      {isOpen && (
        // Plain informational disclosure, not an actionable menu — no
        // role="menu" here since the content isn't a set of actionable
        // menu items (just a status message), and claiming that ARIA
        // widget pattern without backing it would be worse than omitting
        // the role entirely.
        //
        // Opaque background-primary (not the translucent glass-secondary
        // .glass-surface normally uses) is deliberate: unlike the CRUD/
        // confirm modals, this popover has no dimming scrim behind it and
        // can land over anything — a stat card, the ambient canvas glow,
        // chart colors — so full translucency would risk exactly the
        // "content difficult to read" outcome the theme task warns against.
        <div
          className="glass-surface absolute right-0 top-full mt-2 w-64 p-4"
          style={{ background: 'var(--background-primary)' }}
        >
          <p className="text-body-sm font-medium text-fg-primary">Notifications</p>
          <p className="mt-2 text-body-sm text-fg-secondary">You're all caught up — no new notifications.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Real search, not decorative. Shared across the whole dashboard shell (it
 * lives in the Topbar, which wraps every page), but only Projects actually
 * has anything to search — so it drives the `q` URL param that
 * pages/Projects.tsx reads, and navigates there if you're somewhere else
 * when you start typing. Debounced so it doesn't navigate/refetch on every
 * keystroke.
 */
function ProjectSearchInput() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState(() => searchParams.get('q') ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Keep the input in sync if the URL's `q` changes from elsewhere (e.g.
  // clearing it from the Projects page itself, or browser back/forward).
  const currentQ = searchParams.get('q') ?? '';
  useEffect(() => {
    setValue(currentQ);
  }, [location.pathname, currentQ]);

  function applySearch(next: string) {
    if (location.pathname === '/dashboard/projects') {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next.trim()) params.set('q', next);
          else params.delete('q');
          return params;
        },
        { replace: true }
      );
    } else if (next.trim()) {
      navigate(`/dashboard/projects?q=${encodeURIComponent(next)}`);
    }
  }

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => applySearch(next), 300);
  }

  function handleClear() {
    setValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    applySearch('');
  }

  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">Search your projects by title or description</span>
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-tertiary"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            applySearch(value);
          }
        }}
        placeholder="Search projects…"
        // pr-10 at every width: just enough room for the clear button below
        // (only rendered once there's a value). No shortcut-hint chip to
        // additionally reserve space for anymore.
        className="h-11 w-full max-w-xl rounded-full border border-border-glass-secondary bg-bg-secondary pl-10 pr-10 text-body-md text-fg-primary placeholder:text-fg-tertiary backdrop-blur-glass focus-visible:border-brand"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-fg-tertiary transition-colors duration-150 hover:bg-bg-quaternary hover:text-fg-primary active:scale-90"
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'U';
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={`Account menu for ${user.name}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        style={{ backgroundImage: 'var(--gradient-brand-mono)' }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-label-sm2 text-white shadow-light-default transition-all duration-150 hover:shadow-light-hover hover:brightness-110 active:scale-95"
      >
        {initials(user.name)}
      </button>
      {isOpen && (
        // Same reasoning as the Notifications popover above: opaque on
        // purpose, no scrim behind it to isolate it from arbitrary page
        // content.
        <div
          className="glass-surface absolute right-0 top-full mt-2 w-56 p-2"
          style={{ background: 'var(--background-primary)' }}
        >
          <div className="px-2 py-2">
            <p className="truncate text-body-sm font-medium text-fg-primary">{user.name}</p>
            <p className="truncate text-label-sm text-fg-secondary">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-2 rounded-secondary px-2 py-2 text-left text-body-sm text-fg-secondary transition-colors duration-150 hover:bg-bg-quaternary hover:text-fg-primary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut size={16} aria-hidden="true" />
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border-bounds bg-bg-primary/70 px-4 py-3 shadow-structural backdrop-blur-glass sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="rounded-secondary p-2 text-fg-secondary transition-colors duration-150 hover:bg-bg-quaternary hover:text-fg-primary active:scale-90 md:hidden"
      >
        <Menu size={20} />
      </button>

      <ProjectSearchInput />

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
