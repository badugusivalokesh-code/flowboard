import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const { status, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  function validate(): boolean {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = 'Enter a valid email address';
    }
    // Mirrors the server's own rule (server/src/services/authService.ts) so
    // the user sees the same requirement before submitting, not after.
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    if (confirmPassword !== password) next.confirmPassword = "Passwords don't match";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create your account right now');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Card padding="lg">
        <div className="flex justify-center">
          <Logo size={44} glow />
        </div>
        <h1 className="mt-4 text-center text-display-md text-fg-primary">Create your account</h1>
        <p className="mt-1 text-center text-body-sm text-fg-secondary">
          Start tracking your projects in a few seconds.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
            disabled={isSubmitting}
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint={!fieldErrors.password ? 'At least 8 characters' : undefined}
            disabled={isSubmitting}
          />
          <Input
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
          />

          {formError && (
            <p role="alert" className="text-body-sm text-system-danger">
              {formError}
            </p>
          )}

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-body-sm text-fg-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-text hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
