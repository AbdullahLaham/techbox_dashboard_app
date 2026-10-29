// components/assignments/admin/assignment-actions.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Archive, ArchiveRestore, EyeOff, Pencil, Send, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useChangeAssignmentStatus, useDeleteAssignment } from '@/hooks/use-admin-assignments';
import { getAssignmentErrorMessage } from '@/lib/assignment-errors';
import { cn } from '@/lib/utils';
import {
  ASSIGNMENT_STATUS_TRANSITIONS,
  type AdminAssignmentListItem,
  type AssignmentStatus,
} from '@/types/assignments.admin.contract';

type Pending =
  | { kind: 'status'; to: AssignmentStatus }
  | { kind: 'delete' }
  /** Delete was refused because of submissions: offer archiving (spec §9.3). */
  | { kind: 'archive-instead' };

const STATUS_COPY: Record<
  AssignmentStatus,
  { label: string; icon: typeof Send; title: string; description: string; confirm: string }
> = {
  PUBLISHED: {
    label: 'نشر',
    icon: Send,
    title: 'نشر الواجب؟',
    description: 'سيظهر الواجب فوراً لجميع الطلاب المسجّلين في البرنامج.',
    confirm: 'نشر الآن',
  },
  DRAFT: {
    label: 'إلغاء النشر',
    icon: EyeOff,
    title: 'إعادة الواجب إلى مسودة؟',
    description: 'سيختفي الواجب من تطبيق الطلاب. عند نشره لاحقاً سيظهر لهم كواجب جديد.',
    confirm: 'إلغاء النشر',
  },
  ARCHIVED: {
    label: 'أرشفة',
    icon: Archive,
    title: 'أرشفة الواجب؟',
    description: 'سيختفي الواجب من تطبيق الطلاب مع الاحتفاظ بجميع التسليمات والدرجات. يمكنك استعادته لاحقاً.',
    confirm: 'أرشفة',
  },
};

const RESTORE_COPY = {
  label: 'استعادة',
  icon: ArchiveRestore,
  title: 'استعادة الواجب ونشره؟',
  description: 'سيظهر الواجب مجدداً للطلاب المسجّلين فوراً.',
  confirm: 'استعادة ونشر',
};

interface AssignmentActionsProps {
  assignment: Pick<AdminAssignmentListItem, 'id' | 'title' | 'status' | 'submissionsCount'>;
  /** `row`: compact icon buttons for the table. `toolbar`: labelled buttons for the edit page. */
  variant?: 'row' | 'toolbar';
  onDeleted?: () => void;
}

/** Publish / unpublish / archive / restore / delete, each behind a confirmation dialog. */
export function AssignmentActions({ assignment, variant = 'row', onDeleted }: AssignmentActionsProps) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const changeStatus = useChangeAssignmentStatus(assignment.id);
  const remove = useDeleteAssignment();

  const close = () => {
    setPending(null);
    setError(null);
  };

  const targets = ASSIGNMENT_STATUS_TRANSITIONS[assignment.status].filter(
    // Unpublishing is refused by the server once students have submitted; don't offer it.
    (to) => !(to === 'DRAFT' && assignment.submissionsCount > 0),
  );

  const runStatus = (to: AssignmentStatus) =>
    changeStatus.mutate(to, { onSuccess: close, onError: (e) => setError(getAssignmentErrorMessage(e)) });

  const confirm = () => {
    if (!pending) return;
    setError(null);
    if (pending.kind === 'status') return runStatus(pending.to);
    if (pending.kind === 'archive-instead') return runStatus('ARCHIVED');
    remove.mutate(assignment.id, {
      onSuccess: () => {
        close();
        onDeleted?.();
      },
      onError: (e) => {
        if (e.code === 'ASSIGNMENT_HAS_SUBMISSIONS' && assignment.status === 'PUBLISHED') {
          setPending({ kind: 'archive-instead' });
        } else {
          setError(getAssignmentErrorMessage(e));
        }
      },
    });
  };

  const copyFor = (to: AssignmentStatus) => (assignment.status === 'ARCHIVED' && to === 'PUBLISHED' ? RESTORE_COPY : STATUS_COPY[to]);

  const buttonClass =
    variant === 'row'
      ? 'inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      : 'inline-flex items-center gap-1.5 rounded-xl border bg-background px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-muted';

  let dialog: { title: string; description: React.ReactNode; confirm: string; tone: 'default' | 'danger' } | null = null;
  if (pending?.kind === 'status') {
    const copy = copyFor(pending.to);
    dialog = { title: copy.title, description: copy.description, confirm: copy.confirm, tone: 'default' };
  } else if (pending?.kind === 'delete') {
    dialog = {
      title: 'حذف الواجب نهائياً؟',
      description: (
        <>
          سيتم حذف «<bdi className="font-semibold text-foreground">{assignment.title}</bdi>» وجميع ملفاته. لا يمكن التراجع عن
          هذا الإجراء.
        </>
      ),
      confirm: 'حذف نهائي',
      tone: 'danger',
    };
  } else if (pending?.kind === 'archive-instead') {
    dialog = {
      title: 'لا يمكن حذف هذا الواجب',
      description: 'لدى الواجب تسليمات من الطلاب، لذلك لا يمكن حذفه. يمكنك أرشفته بدلاً من ذلك: سيختفي من تطبيق الطلاب مع الاحتفاظ بالتسليمات.',
      confirm: 'أرشفة بدلاً من ذلك',
      tone: 'default',
    };
  }

  return (
    <div className={cn('flex items-center', variant === 'row' ? 'gap-0.5' : 'flex-wrap gap-2')}>
      {variant === 'row' && (
        <Link href={`/admin/assignments/${assignment.id}`} className={buttonClass} title="تعديل" aria-label="تعديل">
          <Pencil className="h-4 w-4" />
        </Link>
      )}

      {targets.map((to) => {
        const copy = copyFor(to);
        const Icon = copy.icon;
        return (
          <button
            key={to}
            type="button"
            className={cn(buttonClass, to === 'PUBLISHED' && variant === 'toolbar' && 'border-gold/40 bg-gold text-navy-900 hover:bg-gold/90')}
            title={copy.label}
            aria-label={copy.label}
            onClick={() => setPending({ kind: 'status', to })}
          >
            <Icon className="h-4 w-4" />
            {variant === 'toolbar' && copy.label}
          </button>
        );
      })}

      <button
        type="button"
        className={cn(buttonClass, 'hover:text-destructive', variant === 'toolbar' && 'text-destructive hover:bg-destructive/10')}
        title="حذف"
        aria-label="حذف"
        onClick={() => setPending({ kind: 'delete' })}
      >
        <Trash2 className="h-4 w-4" />
        {variant === 'toolbar' && 'حذف'}
      </button>

      <ConfirmDialog
        open={!!dialog}
        title={dialog?.title ?? ''}
        description={dialog?.description}
        confirmLabel={dialog?.confirm ?? ''}
        tone={dialog?.tone}
        pending={changeStatus.isPending || remove.isPending}
        error={error}
        onConfirm={confirm}
        onClose={close}
      />
    </div>
  );
}
