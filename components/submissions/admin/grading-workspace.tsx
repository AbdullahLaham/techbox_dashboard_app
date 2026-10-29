// components/submissions/admin/grading-workspace.tsx
'use client';

import { useState } from 'react';
import { ClipboardList, Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { SubmissionQueue } from '@/components/submissions/admin/submission-queue';
import { useAdminAssignments } from '@/hooks/use-admin-assignments';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { GRADING_ASSIGNMENTS_QUERY } from '@/hooks/use-submissions';
import { formatNumber } from '@/lib/format';
import { gradingHref } from '@/lib/grading';
import { cn } from '@/lib/utils';
import type { AdminAssignmentListItem } from '@/types/assignments.admin.contract';

/** Work waiting for a grader first, then the most recent. */
function byPendingFirst(a: AdminAssignmentListItem, b: AdminAssignmentListItem): number {
  return b.pendingReviewCount - a.pendingReviewCount;
}

function AssignmentPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string | undefined;
  onSelect: (assignment: AdminAssignmentListItem) => void;
}) {
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim()) || undefined;
  const { data, isPending, isError, isFetching, refetch } = useAdminAssignments({ ...GRADING_ASSIGNMENTS_QUERY, q });

  const items = data ? [...data.items].sort(byPendingFirst) : [];
  const pendingTotal = items.reduce((sum, a) => sum + a.pendingReviewCount, 0);

  return (
    <aside className="space-y-3 rounded-3xl border bg-card p-4 shadow-sm lg:sticky lg:top-4" aria-label="الواجبات">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-bold text-foreground">الواجبات</h2>
        {data && (
          <span className="text-[11px] text-muted-foreground tabular-nums">{formatNumber(pendingTotal)} بانتظار التقييم</span>
        )}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن واجب…"
          aria-label="ابحث عن واجب"
          className="w-full rounded-xl border bg-background py-2 pr-9 pl-8 text-xs outline-none focus:ring-2 focus:ring-gold"
        />
        {isFetching && !isPending && (
          <Loader2 className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-gold" aria-hidden />
        )}
      </div>

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="جارٍ تحميل الواجبات">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError && !data ? (
        <DashboardError onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <p className="px-1 py-6 text-center text-xs text-muted-foreground">{q ? 'لا توجد واجبات مطابقة.' : 'لا توجد واجبات بعد.'}</p>
      ) : (
        <ul className="max-h-[70vh] space-y-1.5 overflow-y-auto">
          {items.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onSelect(a)}
                aria-current={a.id === selectedId ? 'true' : undefined}
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-right transition-colors',
                  a.id === selectedId ? 'border-gold/50 bg-gold/5' : 'border-transparent hover:bg-muted/40',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground">{a.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {a.program.title} · {a.module.title}
                  </span>
                </span>
                {a.pendingReviewCount > 0 ? (
                  <span
                    className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-navy-900 tabular-nums"
                    title="بانتظار التقييم"
                  >
                    {a.pendingReviewCount}
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums" title="عدد التسليمات">
                    {a.submissionsCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && data.total > data.items.length && (
        <p className="px-1 text-[11px] text-muted-foreground">يُعرض أحدث {data.items.length} واجباً، استخدم البحث للوصول إلى غيرها.</p>
      )}
    </aside>
  );
}

export function GradingWorkspace({ initialAssignmentId }: { initialAssignmentId?: string }) {
  const [assignmentId, setAssignmentId] = useState(initialAssignmentId);
  const [selected, setSelected] = useState<AdminAssignmentListItem | null>(null);

  const select = (assignment: AdminAssignmentListItem) => {
    setAssignmentId(assignment.id);
    setSelected(assignment);
    // Keeps the choice in the URL (back from a hand-in returns here) without a navigation.
    window.history.replaceState(null, '', gradingHref(assignment.id));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-1 border-b pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">تقييم التسليمات</h1>
        <p className="text-xs text-muted-foreground">اختر واجباً لمراجعة تسليمات الطلاب وتقييمها.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <AssignmentPicker selectedId={assignmentId} onSelect={select} />
        {assignmentId ? (
          <SubmissionQueue key={assignmentId} assignmentId={assignmentId} assignment={selected?.id === assignmentId ? selected : null} />
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="اختر واجباً"
            description="تظهر أعلى القائمة الواجبات التي تنتظر تسليماتها التقييم."
          />
        )}
      </div>
    </div>
  );
}

