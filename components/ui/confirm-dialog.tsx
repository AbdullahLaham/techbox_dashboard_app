// components/ui/confirm-dialog.tsx
'use client';

import { useEffect, useId } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  pending?: boolean;
  /** Shown under the description, e.g. the server's refusal. */
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Modal confirmation used before irreversible or student-visible actions. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'إلغاء',
  tone = 'default',
  pending = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, pending, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => !pending && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md space-y-5 rounded-3xl border bg-card p-6 text-right shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          aria-label="إغلاق"
          className="absolute top-4 left-4 rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div
            className={cn(
              'rounded-2xl p-2.5',
              tone === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-gold/10 text-gold',
            )}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div className="space-y-1.5 pt-0.5">
            <h2 id={titleId} className="text-base font-bold text-foreground">
              {title}
            </h2>
            <div className="text-xs leading-relaxed text-muted-foreground">{description}</div>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              'flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold shadow-md disabled:opacity-50',
              tone === 'danger'
                ? 'bg-destructive text-white hover:bg-destructive/90'
                : 'bg-gold text-navy-900 hover:bg-gold/90',
            )}
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
