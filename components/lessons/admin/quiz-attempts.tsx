// components/lessons/admin/quiz-attempts.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ClipboardCheck, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { useQuizAttempts } from '@/hooks/use-admin-nodes';
import { formatDateTime } from '@/lib/assignment-format';
import { formatNumber } from '@/lib/format';
import { formatScore } from '@/lib/lessons';
import type { AdminQuizAttemptListItem } from '@/types/nodes.contract';

const PAGE_SIZE = 20;

type ResultFilter = 'all' | 'passed' | 'failed';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="space-y-1 rounded-2xl border bg-card p-4 shadow-xs">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-xl font-extrabold text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function studentLabel(student: AdminQuizAttemptListItem['student']): string {
  return student.name || student.email;
}

interface QuizAttemptsProps {
  quizId: string;
  /** Builds the link to one attempt's page. */
  attemptHref: (attemptId: string) => string;
}

export function QuizAttempts({ quizId, attemptHref }: QuizAttemptsProps) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<ResultFilter>('all');
  const [student, setStudent] = useState<AdminQuizAttemptListItem['student'] | null>(null);

  const query = {
    page,
    pageSize: PAGE_SIZE,
    ...(result !== 'all' && { passed: result === 'passed' }),
    ...(student && { studentId: student.id }),
  };
  const { data, isPending, isError, isFetching, isPlaceholderData, refetch } = useQuizAttempts(quizId, query);

  if (isPending) {
    return (
      <div className="space-y-4" role="status" aria-label="جارٍ تحميل المحاولات">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (isError && !data) return <DashboardError onRetry={() => void refetch()} />;

  const { stats, items, total } = data;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const passRate = stats.students > 0 ? Math.round((stats.passedStudents / stats.students) * 100) : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="المحاولات" value={formatNumber(stats.attempts)} />
        <StatCard label="الطلاب" value={formatNumber(stats.students)} />
        <StatCard
          label="الطلاب الناجحون"
          value={formatNumber(stats.passedStudents)}
          hint={passRate !== null ? `${passRate}% من الطلاب` : undefined}
        />
        <StatCard
          label="متوسط النسبة"
          value={stats.averagePercentage !== null ? `${formatScore(stats.averagePercentage)}%` : '—'}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs">
        <select
          aria-label="النتيجة"
          value={result}
          onChange={(e) => {
            setResult(e.target.value as ResultFilter);
            setPage(1);
          }}
          className="rounded-xl border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
        >
          <option value="all">كل النتائج</option>
          <option value="passed">ناجح</option>
          <option value="failed">لم ينجح</option>
        </select>
        {student && (
          <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 py-1 pr-3 pl-1 text-[11px] font-semibold text-gold">
            <bdi>{studentLabel(student)}</bdi>
            <button
              type="button"
              onClick={() => {
                setStudent(null);
                setPage(1);
              }}
              className="rounded-full p-0.5 hover:bg-gold/20"
              aria-label="إزالة تصفية الطالب"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
        {isFetching && <Loader2 className="h-4 w-4 animate-spin text-gold" aria-label="جارٍ التحديث" />}
        <span className="ms-auto text-[11px] text-muted-foreground tabular-nums">{formatNumber(total)} محاولة</span>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={stats.attempts === 0 ? 'لا توجد محاولات بعد' : 'لا توجد محاولات مطابقة'}
          description={stats.attempts === 0 ? 'ستظهر هنا محاولات الطلاب بعد نشر الاختبار.' : 'غيّر التصفية لعرض محاولات أخرى.'}
        />
      ) : (
        <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
            <table className="w-full min-w-[640px] text-right text-xs">
              <thead className="border-b bg-muted/40 text-[11px] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">الطالب</th>
                  <th className="px-4 py-3 font-semibold">المحاولة</th>
                  <th className="px-4 py-3 font-semibold">الدرجة</th>
                  <th className="px-4 py-3 font-semibold">النتيجة</th>
                  <th className="px-4 py-3 font-semibold">التاريخ</th>
                  <th className="px-4 py-3">
                    <span className="sr-only">عرض</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStudent(a.student);
                          setPage(1);
                        }}
                        className="text-right hover:text-gold"
                        title="عرض محاولات هذا الطالب فقط"
                      >
                        <span className="block font-semibold text-foreground">
                          <bdi>{studentLabel(a.student)}</bdi>
                        </span>
                        {a.student.name && (
                          <span className="block text-[11px] text-muted-foreground" dir="ltr">
                            {a.student.email}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 tabular-nums">#{a.attemptNumber}</td>
                    <td className="px-4 py-3 tabular-nums">
                      <bdi>
                        {formatScore(a.score)} / {formatScore(a.totalScore)}
                      </bdi>
                      <span className="mr-1.5 text-[11px] text-muted-foreground">({formatScore(a.percentage)}%)</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={a.passed ? 'success' : 'danger'}>{a.passed ? 'ناجح' : 'لم ينجح'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.submittedAt)}</td>
                    <td className="px-4 py-3 text-left">
                      <Link href={attemptHref(a.id)} className="text-[11px] font-bold text-gold hover:underline">
                        التفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
