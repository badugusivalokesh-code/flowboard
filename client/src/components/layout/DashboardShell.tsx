import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileDrawer } from './MobileDrawer';
import { useDrawer } from '@/hooks/useDrawer';

export function DashboardShell({ children }: { children: ReactNode }) {
  const drawer = useDrawer();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop: full sidebar with labels, >=1280px. Own translucent glass
          layer (background + blur), not just a border, so it reads as a
          separate floating panel over the canvas per the reference rather
          than a flat-colored rail. */}
      <aside className="hidden h-full w-72 shrink-0 box-border isolate overflow-hidden rounded-none border-r border-border-bounds bg-bg-primary/60 shadow-structural backdrop-blur-glass xl:block">
        <Sidebar />
      </aside>

      {/* Tablet: compact icon-only rail, ~768-1279px. Previously this range
          had no sidebar at all — just the mobile drawer trigger, which made
          the layout look empty/broken at tablet widths. */}
      <aside className="hidden h-full w-20 shrink-0 box-border isolate overflow-hidden rounded-none border-r border-border-bounds bg-bg-primary/60 shadow-structural backdrop-blur-glass md:flex xl:hidden">
        <Sidebar collapsed />
      </aside>

      {/* Mobile: drawer only, <768px. */}
      <MobileDrawer isOpen={drawer.isOpen} onClose={drawer.close}>
        <Sidebar onNavigate={drawer.close} />
      </MobileDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={drawer.open} />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden scroll-area">{children}</main>
      </div>
    </div>
  );
}
