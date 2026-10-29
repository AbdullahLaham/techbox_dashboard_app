// components/auth/auth-field.tsx
import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthFieldProps extends React.ComponentProps<'input'> {
  label: string;
  icon: LucideIcon;
  /** Rendered at the inline-end of the label row (e.g. "forgot password?"). */
  labelAction?: React.ReactNode;
}

/** Labelled input with a leading icon. Uses logical insets so the icon sits on the right in RTL. */
export function AuthField({ label, icon: Icon, labelAction, className, id, ...inputProps }: AuthFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-sm leading-none font-medium">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id={inputId}
          className={cn(
            'w-full rounded-xl border bg-card py-2.5 ps-10 pe-4 text-sm transition-all focus:ring-2 focus:ring-gold focus:outline-none',
            className,
          )}
          {...inputProps}
        />
      </div>
    </div>
  );
}

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const Icon = tone === 'error' ? AlertCircle : CheckCircle2;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-center gap-2 rounded-xl border p-3.5 text-sm',
        tone === 'error'
          ? 'border-destructive/20 bg-destructive/10 text-destructive'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
