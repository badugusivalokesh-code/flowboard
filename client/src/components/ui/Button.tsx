import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-secondary font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

const variants: Record<Variant, string> = {
  // primary/danger text is intentionally raw `text-white`, not the
  // fg-inverse token: fg-inverse *flips* per theme (white on light,
  // near-black on dark) because it's meant for text sitting on a
  // theme-following surface. These buttons sit on a fixed-color brand/danger
  // background in both themes, so the text must stay white in both too —
  // routing it through fg-inverse would make dark-mode button text
  // near-invisible.
  // Gradient (not flat bg-brand) to match the reference's primary button —
  // still the same brand hues, just a subtle two-stop depth instead of one
  // flat fill. bg-[image:...] with the gradient token as the arbitrary
  // value keeps this in Tailwind's class string rather than needing an
  // inline style just for this one button.
  primary:
    'bg-[image:var(--gradient-brand-mono)] text-white shadow-light-default hover:shadow-light-hover hover:brightness-110',
  secondary:
    'bg-bg-secondary text-fg-primary border border-border-glass-secondary backdrop-blur-glass hover:bg-interactive-secondary-hover hover:border-border-glass',
  ghost: 'bg-transparent text-fg-secondary hover:bg-bg-quaternary hover:text-fg-primary',
  danger: 'bg-system-danger-solid text-white hover:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-body-sm',
  md: 'h-11 px-4 text-body-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, disabled, className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
