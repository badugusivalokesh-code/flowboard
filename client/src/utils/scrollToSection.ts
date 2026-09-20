/**
 * Smooth-scrolls to a dashboard section by id and briefly highlights it, so
 * the user can tell where they landed. This is shared by every entry point
 * that jumps to a same-page dashboard section — Sidebar's "Dashboard"/
 * "Activity" links (same-page case), Dashboard's own hash effect (cross-page
 * case, e.g. Sidebar navigating here from /dashboard/projects), and the stat
 * cards' link into Recent Activity — so there's one implementation of
 * "scroll + highlight" instead of it being duplicated at each call site.
 *
 * Targets must already be in the DOM (every dashboard section wrapper
 * renders unconditionally regardless of loading state — see
 * pages/Dashboard.tsx) and carry the `.dashboard-section` class (index.css)
 * that the highlight styling hooks into. Missing targets are a silent no-op
 * rather than a thrown error, matching how the previous inline
 * `document.getElementById(id)?.scrollIntoView(...)` calls behaved.
 */

const HIGHLIGHT_DURATION_MS = 1600;
const HIGHLIGHT_CLASS = 'section-highlight';

// One pending removal timer per element, so re-triggering a highlight while
// it's still visible (e.g. two stat cards clicked in quick succession, or a
// double-click) restarts the duration instead of an earlier timeout cutting
// the new highlight short.
const highlightTimers = new WeakMap<Element, ReturnType<typeof setTimeout>>();

export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';
  const scrollRoot = target.closest('main');

  if (scrollRoot) {
    const rootRect = scrollRoot.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const scrollMarginTop = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    scrollRoot.scrollTo({
      top: scrollRoot.scrollTop + targetRect.top - rootRect.top - scrollMarginTop,
      behavior: scrollBehavior,
    });
  } else {
    target.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }

  const pendingRemoval = highlightTimers.get(target);
  if (pendingRemoval) clearTimeout(pendingRemoval);

  target.classList.add(HIGHLIGHT_CLASS);
  const timer = setTimeout(() => {
    target.classList.remove(HIGHLIGHT_CLASS);
    highlightTimers.delete(target);
  }, HIGHLIGHT_DURATION_MS);
  highlightTimers.set(target, timer);
}
