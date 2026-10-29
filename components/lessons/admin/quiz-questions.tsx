// components/lessons/admin/quiz-questions.tsx
'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Edit, Eye, EyeOff, ListChecks, Lock, Plus, Trash2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { QuestionEditor } from '@/components/lessons/admin/question-editor';
import { useDeleteQuestion, useUpdateQuestion, useUpdateQuiz } from '@/hooks/use-admin-nodes';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { formatScore, getQuizReadinessProblems } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import { QUIZ_LIMITS, type AdminQuiz, type AdminQuizQuestion } from '@/types/nodes.contract';

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

/* -------------------------------- Publishing ------------------------------- */

function PublishBar({ quiz }: { quiz: AdminQuiz }) {
  const [confirming, setConfirming] = useState(false);
  const updateQuiz = useUpdateQuiz(quiz.id);
  const problems = getQuizReadinessProblems(quiz);
  const publishing = !quiz.isPublished;

  return (
    <section
      className={cn(
        'space-y-3 rounded-3xl border p-5 shadow-sm',
        quiz.isPublished ? 'border-emerald-500/25 bg-emerald-500/5' : 'bg-card',
      )}
      aria-label="حالة النشر"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {quiz.isPublished ? (
              <Badge variant="success">
                <Eye /> منشور للطلاب
              </Badge>
            ) : (
              <Badge variant="muted">
                <EyeOff /> غير منشور
              </Badge>
            )}
            {quiz.isLocked && (
              <Badge variant="warning">
                <Lock /> مقفل بعد المحاولات
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {quiz.isPublished
              ? 'يرى الطلاب هذا الاختبار ويمكنهم تقديمه. أي تعديل يجعله غير مكتمل سيُرفض.'
              : 'لا يرى الطلاب هذا الاختبار حتى تنشره.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            updateQuiz.reset();
            setConfirming(true);
          }}
          disabled={publishing && problems.length > 0}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold shadow-sm disabled:opacity-50',
            publishing ? 'bg-gold text-navy-900 hover:bg-gold/90' : 'border bg-card hover:bg-muted',
          )}
        >
          {publishing ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {publishing ? 'نشر الاختبار' : 'إلغاء النشر'}
        </button>
      </div>

      {publishing && problems.length > 0 && (
        <ul className="space-y-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-400">
          {problems.map((p) => (
            <li key={p} className="flex items-start gap-1.5">
              <XCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /> {p}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirming}
        title={publishing ? 'نشر الاختبار؟' : 'إلغاء نشر الاختبار؟'}
        description={
          publishing
            ? 'سيظهر الاختبار فوراً للطلاب المسجّلين في البرنامج. بعد أول محاولة لن تتمكن من تغيير الأسئلة أو الدرجات أو الإجابات الصحيحة.'
            : 'سيختفي الاختبار عن الطلاب. تبقى محاولاتهم ونتائجهم السابقة محفوظة.'
        }
        confirmLabel={publishing ? 'نشر' : 'إلغاء النشر'}
        pending={updateQuiz.isPending}
        error={updateQuiz.error ? getApiErrorMessage(updateQuiz.error, 'تعذّر تغيير حالة النشر.') : null}
        onConfirm={() => updateQuiz.mutate({ isPublished: publishing }, { onSuccess: () => setConfirming(false) })}
        onClose={() => setConfirming(false)}
      />
    </section>
  );
}

/* --------------------------------- Questions ------------------------------- */

function QuestionCard({
  question,
  number,
  isFirst,
  isLast,
  locked,
  moving,
  onEdit,
  onDelete,
  onMove,
}: {
  question: AdminQuizQuestion;
  number: number;
  isFirst: boolean;
  isLast: boolean;
  locked: boolean;
  moving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const options = [...question.options].sort((a, b) => a.orderIndex - b.orderIndex);
  const iconButton = 'rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30';

  return (
    <li className="space-y-3 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/10 text-xs font-extrabold text-gold tabular-nums">
          {number}
        </span>
        <p dir="auto" className="min-w-0 flex-1 pt-1 text-sm leading-relaxed font-semibold whitespace-pre-wrap text-foreground">
          {question.text}
        </p>
        <Badge variant="gold" className="mt-1 tabular-nums">
          {formatScore(question.points)} درجة
        </Badge>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {options.map((o, i) => (
          <li
            key={o.id}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs',
              o.isCorrect ? 'border-emerald-500/40 bg-emerald-500/5 font-semibold text-emerald-800 dark:text-emerald-300' : 'bg-background text-foreground/80',
            )}
          >
            <span className="shrink-0 text-[11px] font-bold text-muted-foreground">{OPTION_LETTERS[i]}</span>
            <bdi className="min-w-0 flex-1">{o.text}</bdi>
            {o.isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="الإجابة الصحيحة" />}
          </li>
        ))}
      </ul>

      {question.explanation && (
        <p dir="auto" className="rounded-xl bg-muted/50 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
          <span className="font-semibold text-foreground">الشرح: </span>
          {question.explanation}
        </p>
      )}

      <div className="flex items-center justify-end gap-1 border-t pt-3">
        <button type="button" onClick={() => onMove(-1)} disabled={isFirst || moving} className={iconButton} title="تحريك للأعلى" aria-label={`تحريك السؤال ${number} للأعلى`}>
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={isLast || moving} className={iconButton} title="تحريك للأسفل" aria-label={`تحريك السؤال ${number} للأسفل`}>
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onEdit} className={cn(iconButton, 'flex items-center gap-1 px-2.5 text-[11px] font-semibold')}>
          <Edit className="h-3.5 w-3.5" /> تعديل
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={locked}
          className={cn(iconButton, 'flex items-center gap-1 px-2.5 text-[11px] font-semibold hover:bg-destructive/10 hover:text-destructive')}
          title={locked ? 'لا يمكن حذف الأسئلة بعد محاولات الطلاب' : undefined}
        >
          <Trash2 className="h-3.5 w-3.5" /> حذف
        </button>
      </div>
    </li>
  );
}

/** `null`: nothing open; `'new'`: adding a question; otherwise the id of the question being edited. */
type Editing = null | 'new' | string;

export function QuizQuestions({ quiz }: { quiz: AdminQuiz }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<{ question: AdminQuizQuestion; number: number } | null>(null);
  const removeQuestion = useDeleteQuestion();
  const moveQuestion = useUpdateQuestion();

  const questions = [...quiz.questions].sort((a, b) => a.orderIndex - b.orderIndex);
  const canAdd = !quiz.isLocked && questions.length < QUIZ_LIMITS.questionsMax;

  const move = (index: number, direction: -1 | 1) => {
    const target = questions[index + direction];
    if (!target) return;
    moveQuestion.mutate({ questionId: questions[index].id, body: { orderIndex: target.orderIndex } });
  };

  const deleteError = removeQuestion.error
    ? getApiErrorCode(removeQuestion.error) === 'QUIZ_NOT_READY'
      ? 'الاختبار منشور: لا يمكن حذف آخر سؤال أو جعل مجموع الدرجات أقل من درجة النجاح. ألغِ النشر أولاً أو عدّل درجة النجاح.'
      : getApiErrorMessage(removeQuestion.error, 'تعذّر حذف السؤال.')
    : null;

  return (
    <div className="space-y-5">
      <PublishBar quiz={quiz} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <ListChecks className="h-4 w-4 text-gold" aria-hidden /> الأسئلة
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            ({questions.length} · مجموع الدرجات {formatScore(quiz.totalScore)})
          </span>
        </h2>
        {editing !== 'new' && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            disabled={!canAdd}
            title={quiz.isLocked ? 'لا يمكن إضافة أسئلة بعد محاولات الطلاب' : undefined}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> إضافة سؤال
          </button>
        )}
      </div>

      {moveQuestion.error && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {getApiErrorMessage(moveQuestion.error, 'تعذّر تغيير ترتيب السؤال.')}
        </p>
      )}

      {questions.length === 0 && editing !== 'new' ? (
        <EmptyState icon={ListChecks} title="لا توجد أسئلة بعد" description="أضف أسئلة بأربعة خيارات لكل منها وإجابة صحيحة واحدة، ثم انشر الاختبار.">
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy-900 hover:bg-gold/90"
          >
            <Plus className="h-3.5 w-3.5" /> أضف السؤال الأول
          </button>
        </EmptyState>
      ) : (
        <ol className="space-y-4">
          {questions.map((q, i) =>
            editing === q.id ? (
              <li key={q.id}>
                <QuestionEditor quiz={quiz} question={q} number={i + 1} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <QuestionCard
                key={q.id}
                question={q}
                number={i + 1}
                isFirst={i === 0}
                isLast={i === questions.length - 1}
                locked={quiz.isLocked}
                moving={moveQuestion.isPending}
                onEdit={() => setEditing(q.id)}
                onDelete={() => {
                  removeQuestion.reset();
                  setToDelete({ question: q, number: i + 1 });
                }}
                onMove={(direction) => move(i, direction)}
              />
            ),
          )}
          {editing === 'new' && (
            <li>
              <QuestionEditor quiz={quiz} number={questions.length + 1} onDone={() => setEditing(null)} />
            </li>
          )}
        </ol>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title={`حذف السؤال ${toDelete?.number ?? ''}؟`}
        description="سيُحذف السؤال وخياراته نهائياً."
        confirmLabel="حذف"
        tone="danger"
        pending={removeQuestion.isPending}
        error={deleteError}
        onConfirm={() => toDelete && removeQuestion.mutate(toDelete.question.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
