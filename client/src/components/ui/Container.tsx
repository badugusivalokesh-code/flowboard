import type { HTMLAttributes } from 'react';

/**
 * Responsive horizontal padding/max-width wrapper. Not the dashboard shell
 * itself (that's Phase 3) — just the reusable spacing primitive any page
 * content sits inside, consistent across mobile/tablet/desktop.
 */
export function Container({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 xl:px-8 ${className}`} {...props}>
      {children}
    </div>
  );
}
