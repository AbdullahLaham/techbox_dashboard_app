// components/assignments/admin/assignment-editor.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileQuestion } from 'lucide-react';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentActions } from '@/components/assignments/admin/assignment-actions';
import { AssignmentForm } from '@/components/assignments/admin/assignment-form';
import { AssignmentStatusBadge } from '@/components/assignments/admin/assignment-status-badge';
import { AttachmentsPanel } from '@/components/assignments/admin/attachments-panel';
import { useAdminAssignment } from '@/hooks/use-admin-assignments';
import { formatDateTime } from '@/lib/assignment-format';
import { formatNumber } from '@/lib/format';
import { isAssignmentRequestError } from '@/services/assignments-admin-service';

function BackLink() {
  return (
    <Link href="/admin/assignments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
      <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> العودة لقائمة الواجبات
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function AssignmentEditor({ id }: { id: string }) {
  const router = useRouter();
  const { data: assignment, isPending, isError, error, refetch } = useAdminAssignment(id);

  if (isPending) {
    return (
      <div className="space-y-6" role="status" aria-label="جارٍ تحميل الواجب">
        <Skeleton className="h-20 rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[560px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !assignment) {
    if (isAssignmentRequestError(error) && error.code === 'NOT_FOUND') {
      return (
        <div className="space-y-4">
          <BackLink />
          <EmptyState icon={FileQuestion} title="الواجب غير موجود" description="ربما تم حذفه. عُد إلى القائمة لعرض الواجبات المتاحة." />
        </div>
      );
    }
    return <DashboardError onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <BackLink />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">{assignment.title}</h1>
            <AssignmentStatusBadge status={assignment.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {assignment.program.title} · {assignment.track.title} · {assignment.module.title}
          </p>
        </div>
        <AssignmentActions
          assignment={assignment}
          variant="toolbar"
          onDeleted={() => router.replace('/admin/assignments')}
        />
      </div>

      {assignment.status === 'DRAFT' && (
        <p className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-xs text-foreground">
          هذا الواجب مسودة ولا يراه الطلاب. أكمل البيانات وأرفق الملفات ثم اضغط «نشر».
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Keyed by status so a status change (e.g. restore) re-seeds the form with fresh values. */}
          <AssignmentForm key={`${assignment.id}-${assignment.status}`} assignment={assignment} />
        </div>
        <div className="space-y-6">
          <AttachmentsPanel
            assignmentId={assignment.id}
            attachments={assignment.attachments}
            readOnly={assignment.status === 'ARCHIVED'}
          />
          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <h2 className="mb-2 text-base font-bold text-foreground">ملخص</h2>
            <div className="divide-y">
              <Stat label="التسليمات" value={formatNumber(assignment.submissionsCount)} />
              <Stat label="بانتظار التقييم" value={formatNumber(assignment.pendingReviewCount)} />
              <Stat label="تاريخ الإنشاء" value={formatDateTime(assignment.createdAt)} />
              <Stat label="تاريخ النشر" value={assignment.publishedAt ? formatDateTime(assignment.publishedAt) : '—'} />
              <Stat label="آخر تعديل" value={formatDateTime(assignment.updatedAt)} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
