// components/dashboard/admin/grading-queue-preview.tsx
import Link from 'next/link';
import { CheckCircle2, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { formatDateTime } from '@/lib/assignment-format';
import { gradingHref } from '@/lib/grading';
import type { AdminAssignmentListItem } from '@/types/assignments.admin.contract';

/** How many assignments the overview lists before pointing to the full queue. */
const PREVIEW_LIMIT = 5;

function EvaluateLink({ assignmentId }: { assignmentId: string }) {
  return (
    <Link
      href={gradingHref(assignmentId)}
      className="inline-flex items-center justify-center rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
    >
      تقييم
    </Link>
  );
}

function PendingCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold tabular-nums">
      {count} بانتظار التقييم
    </span>
  );
}

interface GradingQueuePreviewProps {
  /** Assignments with pending hand-ins, most first (usePendingReviews). */
  items: readonly AdminAssignmentListItem[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function GradingQueuePreview({ items, isPending, isError, onRetry }: GradingQueuePreviewProps) {
  if (isPending) return <Skeleton className="h-56 rounded-2xl" role="status" aria-label="جارٍ تحميل قائمة التقييم" />;
  if (isError) return <DashboardError onRetry={onRetry} />;
  if (items.length === 0) {
    return <EmptyState icon={Inbox} title="لا توجد تسليمات معلّقة" description="أحسنت! جميع التسليمات تم تقييمها." />;
  }

  const shown = items.slice(0, PREVIEW_LIMIT);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Desktop table */}
      <table className="hidden w-full text-start text-sm md:table">
        <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="p-4 text-start font-semibold">الواجب</th>
            <th scope="col" className="p-4 text-start font-semibold">الموعد</th>
            <th scope="col" className="p-4 text-start font-semibold">التسليمات</th>
            <th scope="col" className="p-4 text-end font-semibold">
              <span className="sr-only">إجراء</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {shown.map((a) => (
            <tr key={a.id} className="transition-colors hover:bg-muted/30">
              <td className="p-4 align-top">
                <div className="font-semibold text-foreground">{a.title}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {a.program.title} · {a.module.title}
                </div>
              </td>
              <td className="p-4 align-top text-xs text-muted-foreground">{a.dueDate ? formatDateTime(a.dueDate) : '—'}</td>
              <td className="p-4 align-top">
                <PendingCount count={a.pendingReviewCount} />
              </td>
              <td className="p-4 text-end align-top">
                <EvaluateLink assignmentId={a.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="divide-y md:hidden">
        {shown.map((a) => (
          <li key={a.id} className="space-y-3 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{a.title}</p>
              <p className="truncate text-xs text-muted-foreground">{a.program.title}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <PendingCount count={a.pendingReviewCount} />
              <EvaluateLink assignmentId={a.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GradingQueueSummary({ total, assignments }: { total: number; assignments: number }) {
  if (assignments <= PREVIEW_LIMIT) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CheckCircle2 className="h-3.5 w-3.5 text-gold" aria-hidden />
      {total} تسليماً بانتظار التقييم في {assignments} واجبات
    </p>
  );
}
