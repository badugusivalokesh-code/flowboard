import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { LayoutGrid, LineChart, PieChart, List, CalendarClock, FolderKanban, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { scrollToSection } from '@/utils/scrollToSection';

/** Shared active-state styling: a solid brand-gradient pill with white text,
 * matching the reference's active nav treatment (previously a faint tinted
 * background). Inline style (not a Tailwind arbitrary class) for the same
 * reason the dropdown panels elsewhere in this file/Topbar use inline
 * `style={{ background: ... }}` — a gradient CSS-var can't be expressed
 * reliably as a Tailwind arbitrary-value class.
 *
 * Uses --gradient-brand-mono (purple-only), not --gradient-brand: the
 * latter's cyan-200 endpoint measures 1.81:1 with white text — badly
 * fails AA. gradient-brand-mono's two stops are both individually
 * verified >=4.5:1 with white text (see index.css), so the label/icon
 * stay readable wherever they land on the pill. This also matches the
 * approved reference more closely, which shows the active item as a
 * fairly uniform purple, not a purple-to-cyan blend. */
const ACTIVE_PILL_STYLE = { backgroundImage: 'var(--gradient-brand-mono)' };

/** Single source of truth for every sidebar nav item's classes (Dashboard,
 * Activity, Projects, and any future item), so the pill is sized and
 * contained identically everywhere instead of each item hand-rolling its
 * own copy. Root-cause fix for the active background not sitting flush:
 * the Projects link previously duplicated this logic inline and, unlike
 * SidebarButton, never set an explicit width — it relied on a `<a>` with
 * `display:flex` implicitly filling its container. That's normally
 * equivalent, but it meant there were two separately-maintained class
 * strings that could silently drift out of sync. `sizing` below is always
 * mutually exclusive (never both `w-full` and a fixed `w-10` at once), so
 * there's no risk of two width utilities of equal specificity competing. */
function navItemClasses(isActive: boolean, collapsed: boolean): string {
  const base = 'box-border flex items-center rounded-secondary border text-body-sm transition-colors duration-150';
  const sizing = collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-3 py-2.5';
  const state = isActive
    ? 'border-white/30 font-medium text-white'
    : 'border-transparent text-fg-secondary hover:bg-bg-quaternary hover:text-fg-primary';
  return `${base} ${sizing} ${state}`;
}

export interface SidebarSection {
  id: string;
  label: string;
}

const SECTIONS: SidebarSection[] = [
  { id: 'overview', label: 'Dashboard' },
];

const ICONS: Record<string, typeof LayoutGrid> = {
  overview: LayoutGrid,
  activity: LineChart,
  'project-status': PieChart,
  'recent-activity': List,
  'upcoming-deadlines': CalendarClock,
};

const ANALYTICS_SECTIONS: SidebarSection[] = [
  { id: 'activity', label: 'Project Activity' },
  { id: 'project-status', label: 'Project Status' },
  { id: 'recent-activity', label: 'Recent Activity' },
  { id: 'upcoming-deadlines', label: 'Upcoming Deadlines' },
];

interface SidebarProps {
  onNavigate?: () => void;
  /** Compact icon-only rail for tablet widths — same behavior, no text
   * labels. Each icon keeps a title/aria-label so it's still identifiable. */
  collapsed?: boolean;
}

export function Sidebar({ onNavigate, collapsed = false }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const onDashboard = location.pathname === '/dashboard';
  const [temporarilyActiveSection, setTemporarilyActiveSection] = useState<string | null>(null);
  const activeSectionTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (activeSectionTimerRef.current) clearTimeout(activeSectionTimerRef.current);
    };
  }, []);

  function activateTemporarily(id: string) {
    if (activeSectionTimerRef.current) clearTimeout(activeSectionTimerRef.current);
    setTemporarilyActiveSection(id);
    activeSectionTimerRef.current = setTimeout(() => {
      setTemporarilyActiveSection(null);
    }, 1600);
  }

  // Previously these just called scrollIntoView, which silently did nothing
  // if the target section wasn't on the current page (e.g. clicking
  // "Activity" while on /dashboard/projects). Now: scroll directly if
  // already on /dashboard, otherwise navigate there with the section as a
  // hash so Dashboard's own mount effect can scroll to it once it renders.
  // Both paths go through the same scrollToSection helper Dashboard's hash
  // effect uses, so a same-page click and a cross-page hash arrival get
  // identical scroll + temporary highlight behavior.
  function handleSectionClick(id: string) {
    activateTemporarily(id);

    if (onDashboard) {
      // Scroll immediately even when the URL already has this hash. A hash-only
      // navigate is a no-op in that case, which made the first click appear
      // broken when the dashboard observer had already written the same hash.
      scrollToSection(id);
      navigate({ pathname: location.pathname, hash: `#${id}` });
    } else {
      navigate(`/dashboard#${id}`);
    }
    onNavigate?.();
  }

  return (
    <nav aria-label="Dashboard sections" className={`flex h-full min-h-0 flex-col ${collapsed ? 'items-center px-2 py-6' : 'px-4 py-6'}`}>
      <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between px-2'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'flex-col gap-1' : ''}`}>
          <Logo size={34} glow />
          {/* Collapsed mode keeps the logo mark (branding stays visible per
              the requirement) but drops the wordmark text to save width. */}
          {!collapsed && (
            <div>
              <p className="text-body-md font-semibold leading-tight text-fg-primary">FlowBoard</p>
              <p className="text-label-sm text-fg-secondary">Analytics</p>
            </div>
          )}
        </div>
        {onNavigate && !collapsed && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close menu"
            className="rounded-secondary p-2 text-fg-secondary transition-colors duration-150 hover:bg-bg-quaternary hover:text-fg-primary active:scale-90"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className={`mt-8 min-h-0 flex-1 overflow-y-auto scroll-area ${collapsed ? 'w-full' : ''}`}>
        {!collapsed && <p className="px-2 text-label-sm font-semibold uppercase tracking-[0.16em] text-fg-tertiary">Main</p>}
        <ul className={`mt-2 flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          <SidebarButton
            section={SECTIONS[0]}
            isActive={temporarilyActiveSection === SECTIONS[0].id}
            collapsed={collapsed}
            onClick={() => handleSectionClick(SECTIONS[0].id)}
          />
        </ul>

        {!collapsed && <p className="mt-6 px-2 text-label-sm font-semibold uppercase tracking-[0.16em] text-fg-tertiary">Analytics</p>}
        <ul className={`mt-2 flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          {ANALYTICS_SECTIONS.map((s) => (
            <SidebarButton
              key={s.id}
              section={s}
              isActive={onDashboard && temporarilyActiveSection === s.id}
              collapsed={collapsed}
              onClick={() => handleSectionClick(s.id)}
            />
          ))}
        </ul>

        {!collapsed && <p className="mt-6 px-2 text-label-sm font-semibold uppercase tracking-[0.16em] text-fg-tertiary">Work</p>}
        <ul className={`mt-2 flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
          <li>
            <NavLink
              to="/dashboard/projects"
              onClick={() => {
                activateTemporarily('projects');
                onNavigate?.();
              }}
              title={collapsed ? 'Projects' : undefined}
              aria-label={collapsed ? 'Projects' : undefined}
              style={() => (temporarilyActiveSection === 'projects' ? ACTIVE_PILL_STYLE : undefined)}
              className={() => navItemClasses(temporarilyActiveSection === 'projects', collapsed)}
            >
              <FolderKanban size={18} aria-hidden="true" />
              {!collapsed && 'Projects'}
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function SidebarButton({
  section,
  isActive,
  collapsed,
  onClick,
}: {
  section: SidebarSection;
  isActive?: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = ICONS[section.id];
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        title={collapsed ? section.label : undefined}
        aria-label={collapsed ? section.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        style={isActive ? ACTIVE_PILL_STYLE : undefined}
        className={`text-left ${navItemClasses(Boolean(isActive), collapsed)}`}
      >
        <Icon size={18} aria-hidden="true" />
        {!collapsed && section.label}
      </button>
    </li>
  );
}

export { SECTIONS as SIDEBAR_SECTIONS };
