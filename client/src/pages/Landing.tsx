import { Link } from 'react-router-dom';
import { LineChart, FolderKanban, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { Card } from '@/components/ui/Card';

/** Names the three things the product actually does (activity trends,
 * project tracking, deadlines) — mirrors the dashboard's own three
 * sections rather than invented marketing copy, so the promise on this
 * page and what the product shows right after signup match. Quiet by
 * design: icon + two short lines each, no card hover/motion of its own —
 * the page's one moment of emphasis is the hero above it. */
const HIGHLIGHTS = [
  {
    icon: LineChart,
    title: 'Activity at a glance',
    description: 'Created vs. completed, plotted over the last 12 months.',
  },
  {
    icon: FolderKanban,
    title: 'Every project in one list',
    description: 'Search, filter by status, and keep details up to date.',
  },
  {
    icon: CalendarClock,
    title: 'Never miss a due date',
    description: "See what's overdue and what's coming up next.",
  },
];

export default function Landing() {
  return (
    <div className="landing-page relative isolate flex min-h-screen flex-col">
        <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:sticky sm:top-0 sm:px-10">
        <div className="flex items-center gap-2.5">
          <Logo size={32} glow />
          <span className="text-body-md font-semibold text-fg-primary">FlowBoard</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-16 text-center">
        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="text-display-xl text-fg-primary">See your projects clearly.</h1>
          <p className="mt-4 max-w-md text-body-lg text-fg-secondary">
            FlowBoard turns your projects into a real-time dashboard — status, activity, and deadlines, all in one
            place.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link to="/register">
              <Button size="md">Create a free account</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="md">
                Log in
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-16 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <Card key={title} padding="md">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-secondary bg-[var(--background-info-tint)] text-[var(--foreground-info)]"
              >
                <Icon size={18} />
              </div>
              <p className="mt-3 text-body-md font-medium text-fg-primary">{title}</p>
              <p className="mt-1 text-body-sm text-fg-secondary">{description}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
