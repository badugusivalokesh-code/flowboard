import { forwardRef, type InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-body-sm text-fg-secondary">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={`h-11 rounded-secondary border bg-bg-secondary px-3.5 text-body-md text-fg-primary placeholder:text-fg-tertiary backdrop-blur-glass transition-colors duration-150 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? 'border-system-danger' : 'border-border-glass-secondary hover:border-border-glass'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-label-sm text-system-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-label-sm text-fg-secondary">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
