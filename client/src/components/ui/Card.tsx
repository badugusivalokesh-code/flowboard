import { type HTMLAttributes, type KeyboardEvent, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Applies the glass hover/focus treatment. Pass `onClick` too to make it
   * a real keyboard-operable control, not just a hover effect. */
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddings = { sm: 'p-4', md: 'p-5', lg: 'p-6' };

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, padding = 'md', className = '', children, onClick, onKeyDown, ...props }, ref) => {
    // A card only becomes a keyboard-operable control when it actually has a
    // click handler — a purely decorative `interactive` (hover-only) card
    // shouldn't be forced into the tab order.
    const isActionable = interactive && !!onClick;

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (isActionable && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        // Let the browser synthesize a real click rather than manually
        // invoking `onClick` with a KeyboardEvent cast through `unknown` —
        // that cast discarded all type safety and would misbehave if a
        // consumer's handler ever read a mouse-specific property (clientX,
        // button, etc.), since it would actually be a KeyboardEvent at
        // runtime. `.click()` fires the same onClick prop below, but with a
        // genuine, correctly-typed MouseEvent.
        e.currentTarget.click();
      }
    };

    return (
      <div
        ref={ref}
        role={isActionable ? 'button' : undefined}
        tabIndex={isActionable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={isActionable ? handleKeyDown : onKeyDown}
        className={`glass-surface ${interactive ? 'glass-surface--interactive' : ''} ${
          isActionable ? 'cursor-pointer' : ''
        } ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

/** Same component, more literal name — the Figma reference and Phase 2 spec
 * both call this "Card / GlassCard"; every surface in this app is glass, so
 * there's one implementation instead of two near-identical components. */
export const GlassCard = Card;
