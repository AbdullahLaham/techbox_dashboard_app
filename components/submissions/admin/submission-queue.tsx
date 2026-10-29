// components/submissions/admin/submission-queue.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Inbox, Loader2, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { LateBadge, SubmissionStatusBadge } from '@/components/submissions/submission-parts';
import { useAdminSubmissions } from '@/hooks/use-submissions';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatDateTime } from '@/lib/assignment-format';
import { formatNumber } from '@/lib/format';
import { submissionHref } from '@/lib/grading';
import { SUBMISSION_STATUS_LABELS, SUBMISSION_TYPE_LABELS } from '@/lib/labels';
import { formatScore } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import type { AdminAssignmentListItem } from '@/types/assignments.admin.contract';
import type { SubmissionStatus } from '@/types/submissions.contract';

const PAGE_SIZE = 20;

/** Tab order: work waiting for a grader first. */
const STATUS_TABS: readonly SubmissionStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION', 'GRADED', 'REJECTED'];

type Tab = SubmissionStatus | 'ALL';

interface SubmissionQueueProps {
  assignmentId: string;
  /** The picked row, when known; otherwise the header is read from the hand-ins. */
  assignment: AdminAssignmentListItem | null;
}

export function SubmissionQueue({ assignmentId, assignment }: SubmissionQueueProps) {
  const [tab, setTab] = useState<Tab>('ALL');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [allAttempts, setAllAttempts] = useState(false);
  const q = useDebouncedValue(search.trim());

  // A new search starts on the first page.
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    setPage(1);
  }

  const query = {
    page,
    pageSize: PAGE_SIZE,
    latestOnly: !allAttempts,
    ...(tab !== 'ALL' && { status: tab }),
    ...(q && { q }),
  };
  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useAdminSubmissions(assignmentId, query);

  const info = assignment ?? data?.items[0]?.assignment ?? null;

  if (isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="جارٍ تحميل التسليمات">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }
  if (isError && !data) return <DashboardError onRetry={() => void refetch()} />;

  const counts = data.statusCounts;
  const allCount = STATUS_TABS.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  const pageCount = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const changeTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  return (
    <section className="min-w-0 space-y-4" aria-label="التسليمات">
      <div className="space-y-2 rounded-3xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-extrabold text-foreground">{info?.title ?? 'التسليمات'}</h2>
        {info && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
            {assignment && <span>{assignment.program.title}</span>}
            {assignment && <span>نوع التسليم: {SUBMISSION_TYPE_LABELS[assignment.allowedType]}</span>}
            <span className="tabular-nums">الدرجة العظمى: {formatScore(info.maxScore)}</span>
            {info.dueDate && <span>الموعد: {formatDateTime(info.dueDate)}</span>}
          </div>
        )}
      </div>

      <div role="tablist" aria-label="حالة التسليم" className="flex gap-1 overflow-x-auto rounded-2xl border bg-card p-1 shadow-xs">
        {(['ALL', ...STATUS_TABS] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => changeTab(t)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors',
              tab === t ? 'bg-navy-900 text-white dark:bg-gold dark:text-navy-900' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {t === 'ALL' ? 'الكل' : SUBMISSION_STATUS_LABELS[t]}
            <span className="rounded-full bg-black/10 px-1.5 text-[10px] tabular-nums dark:bg-white/10">
              {formatNumber(t === 'ALL' ? allCount : (counts[t] ?? 0))}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم الطالب أو بريده…"
            aria-label="ابحث عن طالب"
            className="w-full rounded-xl border bg-background py-2 pr-9 pl-3 text-xs outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={allAttempts}
            onChange={(e) => {
              setAllAttempts(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 accent-gold"
          />
          كل المحاولات
        </label>
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gold" aria-label="جارٍ التحديث" />}
        <span className="ms-auto text-[11px] text-muted-foreground tabular-nums">{formatNumber(data.total)} تسليم</span>
      </div>

      {data.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={allCount === 0 && !q ? 'لا توجد تسليمات بعد' : 'لا توجد تسليمات مطابقة'}
          description={allCount === 0 && !q ? 'ستظهر هنا حلول الطلاب عند تسليمها.' : 'غيّر التصفية أو البحث لعرض تسليمات أخرى.'}
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full min-w-[680px] text-right text-xs">
              <thead className="border-b bg-muted/40 text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">الطالب</th>
                  <th className="px-4 py-3 font-semibold">المحاولة</th>
                  <th className="px-4 py-3 font-semibold">التسليم</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 font-semibold">الدرجة</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">مراجعة</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.items.map((s) => {
                  const waiting = s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW';
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-foreground">
                          <bdi>{s.student.name || s.student.email}</bdi>
                        </span>
                        {s.student.name && (
                          <span className="block text-[11px] text-muted-foreground" dir="ltr">
                            {s.student.email}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">#{s.attemptNumber}</td>
                      <td className="px-4 py-3">
                        <span className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                          {formatDateTime(s.submittedAt)}
                          {s.isLate && <LateBadge />}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <SubmissionStatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {s.score !== null ? (
                          <bdi>
                            {formatScore(s.score)} / {formatScore(s.maxScore)}
                          </bdi>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-left">
                        <Link
                          href={submissionHref(s.id)}
                          className={cn(
                            'inline-flex rounded-xl px-3 py-1.5 text-[11px] font-bold',
                            waiting ? 'bg-gold text-navy-900 hover:bg-gold/90' : 'text-gold hover:underline',
                          )}
                        >
                          {waiting ? 'تقييم' : 'عرض'}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <nav aria-label="الصفحات" className="mt-4 flex items-center justify-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-xl border bg-card px-3 py-1.5 font-semibold hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden /> السابق
              </button>
              <span className="text-muted-foreground tabular-nums">
                {page} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pageCount}
                className="flex items-center gap-1 rounded-xl border bg-card px-3 py-1.5 font-semibold hover:bg-muted disabled:opacity-40"
              >
                التالي <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
            </nav>
          )}
        </div>
      )}
    </section>
  );
}
