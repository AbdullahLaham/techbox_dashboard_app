// components/submissions/admin/submission-review.tsx
'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, FileQuestion } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { GradeForm } from '@/components/submissions/admin/grade-form';
import { LateBadge, SubmissionContentView, SubmissionStatusBadge } from '@/components/submissions/submission-parts';
import { useAdminSubmission, useAdminSubmissions } from '@/hooks/use-submissions';
import { getApiErrorCode } from '@/lib/api-error';
import { formatDateTime } from '@/lib/assignment-format';
import { gradingHref, submissionHref } from '@/lib/grading';
import { SUBMISSION_TYPE_LABELS } from '@/lib/labels';
import { formatScore } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import type { AdminSubmission } from '@/types/submissions.contract';

/** More attempts than any student realistically makes on one assignment. */
const ATTEMPTS_PAGE_SIZE = 50;

/** Every attempt of this student on this assignment, newest first. */
function StudentAttempts({ submission }: { submission: AdminSubmission }) {
  const { data, isPending } = useAdminSubmissions(submission.assignment.id, {
    latestOnly: false,
    q: submission.student.email,
    pageSize: ATTEMPTS_PAGE_SIZE,
  });
  // `q` also matches other students whose email contains this one.
  const attempts = (data?.items ?? [])
    .filter((s) => s.student.id === submission.student.id)
    .sort((a, b) => b.attemptNumber - a.attemptNumber);
  const newer = attempts.find((s) => s.attemptNumber > submission.attemptNumber && s.id !== submission.id);

  return (
    <>
      {newer && (
        <Link
          href={submissionHref(attempts[0].id)}
          className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-800 hover:bg-amber-500/10 dark:text-amber-300"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            هذه ليست أحدث محاولة للطالب. <span className="font-bold underline">افتح المحاولة {attempts[0].attemptNumber}</span>
          </span>
        </Link>
      )}

      <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="attempts-heading">
        <h2 id="attempts-heading" className="text-base font-bold text-foreground">
          محاولات الطالب
        </h2>
        {isPending ? (
          <Skeleton className="h-24 rounded-xl" />
        ) : attempts.length <= 1 ? (
          <p className="text-xs text-muted-foreground">هذه المحاولة الوحيدة.</p>
        ) : (
          <ol className="space-y-1.5">
            {attempts.map((a) => {
              const current = a.id === submission.id;
              return (
                <li key={a.id}>
                  <Link
                    href={submissionHref(a.id)}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'flex flex-wrap items-center gap-2 rounded-xl border p-3 text-xs transition-colors',
                      current ? 'border-gold/50 bg-gold/5' : 'hover:bg-muted/40',
                    )}
                  >
                    <span className="font-semibold text-foreground tabular-nums">#{a.attemptNumber}</span>
                    <SubmissionStatusBadge status={a.status} />
                    {a.score !== null && (
                      <span className="tabular-nums text-muted-foreground">
                        <bdi>
                          {formatScore(a.score)} / {formatScore(a.maxScore)}
                        </bdi>
                      </span>
                    )}
                    <span className="ms-auto text-[11px] text-muted-foreground">{formatDateTime(a.submittedAt)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </>
  );
}

export function SubmissionReview({ submissionId }: { submissionId: string }) {
  const { data: submission, isPending, isError, error, refetch } = useAdminSubmission(submissionId);

  if (isPending) {
    return (
      <div className="space-y-6" role="status" aria-label="جارٍ تحميل التسليم">
        <Skeleton className="h-36 rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !submission) {
    if (getApiErrorCode(error) === 'NOT_FOUND') {
      return (
        <div className="space-y-4">
          <Link href={gradingHref()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
            <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> العودة إلى قائمة التقييم
          </Link>
          <EmptyState icon={FileQuestion} title="التسليم غير موجود" description="ربما حُذف الواجب أو الدرس." />
        </div>
      );
    }
    return <DashboardError onRetry={() => void refetch()} />;
  }

  const { student, assignment, grader } = submission;

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-3 border-b pb-5">
        <Link
          href={gradingHref(assignment.id)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> العودة إلى تسليمات الواجب
        </Link>
        <p className="text-xs font-semibold text-gold">{assignment.title}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            <bdi>{student.name || student.email}</bdi>
          </h1>
          <SubmissionStatusBadge status={submission.status} />
          {submission.isLate && <LateBadge />}
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          {student.name && <span dir="ltr">{student.email}</span>}
          <span>المحاولة رقم {submission.attemptNumber}</span>
          <span>سُلّم {formatDateTime(submission.submittedAt)}</span>
          {assignment.dueDate && <span>الموعد: {formatDateTime(assignment.dueDate)}</span>}
          {submission.reviewedAt && (
            <span>
              آخر مراجعة {formatDateTime(submission.reviewedAt)}
              {grader?.name && (
                <>
                  {' '}
                  بواسطة <bdi>{grader.name}</bdi>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm lg:col-span-2" aria-labelledby="content-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="content-heading" className="text-base font-bold text-foreground">
              التسليم
            </h2>
            <span className="text-[11px] text-muted-foreground">{SUBMISSION_TYPE_LABELS[submission.content.type]}</span>
          </div>
          <SubmissionContentView
            content={submission.content}
            textLabel={submission.content.type === 'TEXT_CONTENT' ? 'إجابة الطالب' : 'ملاحظة الطالب'}
          />
        </section>

        <div className="space-y-6">
          <GradeForm key={submission.id} submission={submission} />
          <StudentAttempts submission={submission} />
        </div>
      </div>
    </div>
  );
}
