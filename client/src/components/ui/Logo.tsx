import { useId } from 'react';

interface LogoProps {
  /** Pixel size of the square icon. */
  size?: number;
  className?: string;
  /** Adds the two-tone brand glow behind the mark — used where the logo
   * sits on its own (sidebar, auth pages), not inside an already-glowing
   * button/chip context. */
  glow?: boolean;
}

/**
 * Geometric interlocking mark from the supplied reference: two rounded
 * chevrons — purple pointing right, cyan pointing left — meeting at the
 * center to read as a single bowtie/infinity-style symbol. Icon only, no
 * wordmark baked in (per the reference brief) — "FlowBoard" stays as
 * separate real text wherever this renders next to a label.
 */
export function Logo({ size = 36, className = '', glow = false }: LogoProps) {
  // DashboardShell renders Sidebar (and therefore this logo) three times at
  // once — desktop rail, tablet rail, and the mobile drawer — two of them
  // hidden via CSS rather than unmounted. Gradient ids must stay unique
  // per-instance or the DOM ends up with duplicate ids, so each mount gets
  // its own suffix instead of a fixed string id.
  const uid = useId();
  const purpleId = `pb-logo-purple-${uid}`;
  const cyanId = `pb-logo-cyan-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={`shrink-0 rounded-full ${glow ? 'shadow-brand-glow' : ''} ${className}`}
    >
      <defs>
        <linearGradient id={purpleId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--purple-100)" />
          <stop offset="100%" stopColor="var(--purple-200)" />
        </linearGradient>
        <linearGradient id={cyanId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--cyan-100)" />
          <stop offset="100%" stopColor="var(--cyan-200)" />
        </linearGradient>
      </defs>
      <path
        d="M24,20 L50,50 L24,80"
        fill="none"
        stroke={`url(#${purpleId})`}
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M76,20 L50,50 L76,80"
        fill="none"
        stroke={`url(#${cyanId})`}
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
