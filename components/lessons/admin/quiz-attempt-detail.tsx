// components/lessons/admin/quiz-attempt-detail.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleSlash, FileQuestion, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { useQuizAttempt } from '@/hooks/use-admin-nodes';
import { getApiErrorCode } from '@/lib/api-error';
import { formatDateTime } from '@/lib/assignment-format';
import { formatScore } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import type { QuizResultQuestion } from '@/types/nodes.contract';

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

function QuestionResult({ question, number }: { question: QuizResultQuestion; number: number }) {
  const answered = question.selectedOptionId !== null;
  return (
    <li className="space-y-3 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold tabular-nums',
            question.isCorrect ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive',
          )}
        >
          {number}
        </span>
        <p dir="auto" className="min-w-0 flex-1 pt-1 text-sm leading-relaxed font-semibold whitespace-pre-wrap text-foreground">
          {question.text}
        </p>
        <Badge variant={question.isCorrect ? 'success' : 'danger'} className="mt-1 tabular-nums">
          {formatScore(question.pointsAwarded)} / {formatScore(question.points)}
        </Badge>
      </div>

      {!answered && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          <CircleSlash className="h-3.5 w-3.5" aria-hidden /> لم يُجب الطالب عن هذا السؤال
        </p>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {question.options.map((o, i) => {
          const selected = o.id === question.selectedOptionId;
          const correct = o.id === question.correctOptionId;
          return (
            <li
              key={o.id}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs',
                correct && 'border-emerald-500/40 bg-emerald-500/5 font-semibold text-emerald-800 dark:text-emerald-300',
                selected && !correct && 'border-destructive/40 bg-destructive/5 text-destructive',
                !selected && !correct && 'bg-background text-foreground/80',
              )}
            >
              <span className="shrink-0 text-[11px] font-bold text-muted-foreground">{OPTION_LETTERS[i]}</span>
              <bdi className="min-w-0 flex-1">{o.text}</bdi>
              {selected && <span className="shrink-0 text-[10px] font-bold">إجابة الطالب</span>}
              {correct ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="الإجابة الصحيحة" />
              ) : (
                selected && <XCircle className="h-4 w-4 shrink-0" aria-hidden />
              )}
            </li>
          );
        })}
      </ul>

      {question.explanation && (
        <p dir="auto" className="rounded-xl bg-muted/50 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
          <span className="font-semibold text-foreground">الشرح: </span>
          {question.explanation}
        </p>
      )}
    </li>
  );
}

export function QuizAttemptDetail({ attemptId, backHref }: { attemptId: string; backHref: string }) {
  const { data: attempt, isPending, isError, error, refetch } = useQuizAttempt(attemptId);

  const backLink = (
    <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
      <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> العودة إلى المحاولات
    </Link>
  );

  if (isPending) {
    return (
      <div className="space-y-6" role="status" aria-label="جارٍ تحميل المحاولة">
        <Skeleton className="h-36 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (isError || !attempt) {
    if (getApiErrorCode(error) === 'NOT_FOUND') {
      return (
        <div className="space-y-4">
          {backLink}
          <EmptyState icon={FileQuestion} title="المحاولة غير موجودة" description="ربما حُذف الاختبار أو الدرس." />
        </div>
      );
    }
    return <DashboardError onRetry={() => void refetch()} />;
  }

  const correctCount = attempt.questions.filter((q) => q.isCorrect).length;

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm">
        {backLink}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-foreground">
              <bdi>{attempt.student.name || attempt.student.email}</bdi>
            </h1>
            {attempt.student.name && (
              <p className="text-xs text-muted-foreground" dir="ltr">
                {attempt.student.email}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              المحاولة رقم {attempt.attemptNumber} · {formatDateTime(attempt.submittedAt)}
            </p>
          </div>
          <Badge variant={attempt.passed ? 'success' : 'danger'} className="px-3 py-1 text-xs">
            {attempt.passed ? 'ناجح' : 'لم ينجح'}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
            <span className="font-bold text-foreground tabular-nums">
              <bdi>
                {formatScore(attempt.score)} / {formatScore(attempt.totalScore)}
              </bdi>{' '}
              ({formatScore(attempt.percentage)}%)
            </span>
            <span className="text-muted-foreground tabular-nums">
              درجة النجاح {formatScore(attempt.passingScore)} · {correctCount} من {attempt.questions.length} إجابات صحيحة
            </span>
          </div>
          <Progress
            value={attempt.percentage}
            label="نسبة الدرجة"
            indicatorClassName={attempt.passed ? 'bg-emerald-500' : 'bg-destructive'}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">تُعرض الأسئلة والدرجات كما كانت لحظة التسليم.</p>
      </div>

      <ol className="space-y-4">
        {attempt.questions.map((q, i) => (
          <QuestionResult key={q.questionId} question={q} number={i + 1} />
        ))}
      </ol>
    </div>
  );
}
