import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

interface LocationState {
  from?: { pathname: string };
}

const DEMO_CREDENTIALS = {
  email: 'demo@pulseboard.dev',
  password: 'DemoPass123!',
};

export default function Login() {
  const { status, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCredential, setCopiedCredential] = useState<'email' | 'password' | null>(null);

  // Already signed in — no reason to show the login form.
  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  function validate(): boolean {
    const next: typeof fieldErrors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Enter a valid email address';
    }
    if (!password) {
      next.password = 'Password is required';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to log in right now');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyCredential(field: 'email' | 'password') {
    await navigator.clipboard.writeText(DEMO_CREDENTIALS[field]);
    setCopiedCredential(field);
    window.setTimeout(() => setCopiedCredential(null), 1600);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Card padding="lg">
        <div className="flex justify-center">
          <Logo size={44} glow />
        </div>
        <h1 className="mt-4 text-center text-display-md text-fg-primary">Log in to FlowBoard</h1>
        <p className="mt-1 text-center text-body-sm text-fg-secondary">Welcome back — enter your details below.</p>

        <div className="mt-5 rounded-secondary border border-border-glass-secondary bg-bg-secondary p-3">
          <p className="text-label-sm font-medium uppercase tracking-wide text-fg-secondary">Demo account</p>
          <div className="mt-2 flex flex-col gap-2">
            {(['email', 'password'] as const).map((field) => {
              const isCopied = copiedCredential === field;
              return (
                <div key={field} className="flex min-w-0 items-center gap-2">
                  <span className="w-16 shrink-0 text-label-sm text-fg-secondary">
                    {field === 'email' ? 'Email' : 'Password'}
                  </span>
                  <code className="min-w-0 flex-1 truncate text-body-sm text-fg-primary">{DEMO_CREDENTIALS[field]}</code>
                  <button
                    type="button"
                    onClick={() => copyCredential(field)}
                    aria-label={`Copy demo ${field}`}
                    title={`Copy demo ${field}`}
                    className="shrink-0 rounded-secondary p-1.5 text-fg-secondary transition-colors hover:bg-bg-quaternary hover:text-fg-primary"
                  >
                    {isCopied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                  </button>
                  {isCopied && <span className="sr-only">Copied</span>}
                </div>
              );
            })}
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            disabled={isSubmitting}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={isSubmitting}
          />

          {formError && (
            <p role="alert" className="text-body-sm text-system-danger">
              {formError}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-body-sm text-fg-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-brand-text hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
