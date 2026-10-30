// components/users/admin/user-parts.tsx
'use client';

import { useId, useState } from 'react';
import { Check, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generatePassword, ROLE_BADGE_VARIANT, USER_STATUS_BADGE_VARIANT } from '@/lib/users';
import { cn } from '@/lib/utils';
import { ROLE_LABELS_AR, USER_STATUS_LABELS_AR, type GlobalRole, type UserStatus } from '@/types/api.contract';

export function RoleBadge({ role }: { role: GlobalRole }) {
  return <Badge variant={ROLE_BADGE_VARIANT[role]}>{ROLE_LABELS_AR[role]}</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge variant={USER_STATUS_BADGE_VARIANT[status]}>{USER_STATUS_LABELS_AR[status]}</Badge>;
}

export const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold aria-[invalid=true]:border-destructive';

/** Label, control and the message under it. `children` receives the ids to wire up. */
export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-foreground">
        {label}
      </label>
      {children({ id, describedBy: message ? messageId : undefined, invalid: !!error })}
      {message && (
        <p id={messageId} className={cn('text-[11px]', error ? 'text-destructive' : 'text-muted-foreground')}>
          {message}
        </p>
      )}
    </div>
  );
}

/** Password input with "generate", show/hide and copy, for temporary passwords shared with the person. */
export function PasswordInput({
  id,
  value,
  onChange,
  describedBy,
  invalid,
  readOnly = false,
}: {
  id: string;
  value: string;
  onChange?: (value: string) => void;
  describedBy?: string;
  invalid?: boolean;
  /** Shows a password to copy (no editing, no "generate"). */
  readOnly?: boolean;
}) {
  const [visible, setVisible] = useState(readOnly);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (permissions, insecure origin): the field can still be copied by hand.
    }
  };

  const iconButton = 'rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40';

  return (
    <div className="flex items-center gap-1.5">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        autoComplete="new-password"
        dir="ltr"
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={cn(inputClass, 'font-mono')}
      />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} className={iconButton}>
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button type="button" onClick={() => void copy()} disabled={!value} aria-label="نسخ كلمة المرور" className={iconButton}>
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
      {!readOnly && (
        <button
          type="button"
          onClick={() => {
            onChange?.(generatePassword());
            setVisible(true);
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold hover:bg-muted"
        >
          <RefreshCw className="h-3.5 w-3.5" /> توليد
        </button>
      )}
    </div>
  );
}
