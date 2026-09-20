import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Project, ProjectStatus } from '@/types';
import { PROJECT_STATUSES, STATUS_LABELS } from '@/types';
import { ApiRequestError } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface ProjectFormValues {
  title: string;
  description: string;
  status: ProjectStatus;
  dueDate: string; // yyyy-mm-dd for the native date input, or '' for none
}

interface ProjectFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  project?: Project | null;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10); // ISO string -> yyyy-mm-dd, exactly what <input type="date"> expects
}

function emptyValues(): ProjectFormValues {
  return { title: '', description: '', status: 'todo', dueDate: '' };
}

export function ProjectFormModal({ open, mode, project, onClose, onSubmit }: ProjectFormModalProps) {
  const [values, setValues] = useState<ProjectFormValues>(emptyValues());
  const [titleError, setTitleError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useBodyScrollLock(open);

  // Re-seed the form whenever it opens (covers both "open for a new project"
  // and "open to edit project X" — including switching straight from editing
  // one project to another without the modal ever fully unmounting).
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setTitleError(null);
    if (mode === 'edit' && project) {
      setValues({
        title: project.title,
        description: project.description,
        status: project.status,
        dueDate: toDateInputValue(project.dueDate),
      });
    } else {
      setValues(emptyValues());
    }
  }, [open, mode, project]);

  // Same Escape-to-close + Tab focus-trap pattern as ConfirmDialog — this
  // modal has many more focusable fields, so trapping focus matters even
  // more here.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!values.title.trim()) {
      setTitleError('Title is required');
      return;
    }
    setTitleError(null);

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      // Server validation errors (400) surface here verbatim — the server
      // is the source of truth, this isn't just re-stating a client check.
      setFormError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-form-title"
        ref={dialogRef}
        // max-h + overflow-y-auto: this is the tallest overlay in the app
        // (title + description + a 2-field row + error + actions), and body
        // scroll is locked while it's open (useBodyScrollLock above) — with
        // no cap, a short viewport (e.g. a phone in landscape) previously
        // clipped the bottom of the dialog with no way to reach Cancel/
        // Submit at all. Matches the overlay's own `p-4` so the dialog never
        // touches the viewport edge. ConfirmDialog doesn't need this: its
        // content is short enough to fit even at the smallest landscape
        // heights checked (verified at 667x320).
        className="glass-surface glass-surface--elevated w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto p-6"
      >
        <h2 id="project-form-title" className="text-display-sm text-fg-primary">
          {mode === 'create' ? 'New project' : 'Edit project'}
        </h2>

        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Title"
            value={values.title}
            onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            error={titleError ?? undefined}
            maxLength={140}
            disabled={isSubmitting}
            autoFocus
          />
          <Textarea
            label="Description"
            value={values.description}
            onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
            maxLength={2000}
            disabled={isSubmitting}
          />

          {/* grid-cols-1 below sm: at 320-375px a hard 2-up grid left each of
              Status/Due date under ~110px wide, cramping the select and the
              native date input. Single column until there's room for both. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="project-status" className="text-body-sm text-fg-secondary">
                Status
              </label>
              <select
                id="project-status"
                value={values.status}
                onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as ProjectStatus }))}
                disabled={isSubmitting}
                className="h-11 rounded-secondary border border-border-glass-secondary bg-bg-secondary px-3 text-body-md text-fg-primary backdrop-blur-glass transition-colors duration-150 hover:border-border-glass focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Due date"
              type="date"
              value={values.dueDate}
              onChange={(e) => setValues((v) => ({ ...v, dueDate: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>

          {formError && (
            <p role="alert" className="text-body-sm text-system-danger">
              {formError}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {mode === 'create' ? 'Create project' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
