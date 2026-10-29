// components/submissions/admin/grade-form.tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, Eye, Loader2, Pencil, RotateCcw, XCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useGradeSubmission } from '@/hooks/use-submissions';
import { getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { formatScore, parseScore } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import { SUBMISSION_LIMITS, type AdminSubmission, type GradeStatus } from '@/types/submissions.contract';

type Decision = Exclude<GradeStatus, 'UNDER_REVIEW'>;

const DECISIONS: readonly { id: Decision; label: string; hint: string; icon: typeof CheckCircle2; tone: string }[] = [
  {
    id: 'GRADED',
    label: 'اعتماد الدرجة',
    hint: 'يُغلق التسليم ويُحتسب الدرس مكتملاً للطالب.',
    icon: CheckCircle2,
    tone: 'peer-checked:border-emerald-500/60 peer-checked:bg-emerald-500/5',
  },
  {
    id: 'NEEDS_REVISION',
    label: 'طلب تعديلات',
    hint: 'يستطيع الطالب تسليم محاولة جديدة.',
    icon: RotateCcw,
    tone: 'peer-checked:border-amber-500/60 peer-checked:bg-amber-500/5',
  },
  {
    id: 'REJECTED',
    label: 'رفض نهائي',
    hint: 'لا يستطيع الطالب التسليم مرة أخرى.',
    icon: XCircle,
    tone: 'peer-checked:border-destructive/60 peer-checked:bg-destructive/5',
  },
];

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold aria-invalid:border-destructive disabled:opacity-60';

type FieldErrors = Partial<Record<'score' | 'feedback' | 'form', string>>;

function initialDecision(status: AdminSubmission['status']): Decision {
  return status === 'NEEDS_REVISION' || status === 'REJECTED' ? status : 'GRADED';
}

/** Grade, ask for changes or reject. Every decision notifies the student. */
export function GradeForm({ submission }: { submission: AdminSubmission }) {
  const reviewed = submission.status === 'GRADED' || submission.status === 'NEEDS_REVISION' || submission.status === 'REJECTED';
  const [editing, setEditing] = useState(!reviewed);
  const [decision, setDecision] = useState<Decision>(initialDecision(submission.status));
  const [score, setScore] = useState(submission.score !== null ? String(submission.score) : '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmReject, setConfirmReject] = useState(false);
  const [saved, setSaved] = useState(false);

  const grade = useGradeSubmission(submission.id);
  const startReview = useGradeSubmission(submission.id);
  const maxScore = submission.maxScore;

  const send = () => {
    setConfirmReject(false);
    const text = feedback.trim();
    grade.mutate(
      {
        status: decision,
        ...(decision === 'GRADED' && { score: parseScore(score, { max: maxScore }) }),
        feedback: text || null,
      },
      {
        onSuccess: () => {
          setEditing(false);
          setSaved(true);
        },
        onError: (error) => {
          const details = getApiErrorDetails(error);
          setErrors({
            score: details.score,
            feedback: details.feedback,
            form: details.score || details.feedback ? undefined : getApiErrorMessage(error, 'تعذّر حفظ التقييم.'),
          });
        },
      },
    );
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const found: FieldErrors = {};
    if (decision === 'GRADED' && parseScore(score, { max: maxScore }) === null) {
      found.score = `أدخل درجة بين 0 و${formatScore(maxScore)} (منزلتان عشريتان على الأكثر).`;
    }
    if (decision !== 'GRADED' && !feedback.trim()) found.feedback = 'اكتب للطالب سبب القرار وما المطلوب منه.';
    if (feedback.trim().length > SUBMISSION_LIMITS.feedbackMax) {
      found.feedback = `الملاحظات أطول من ${SUBMISSION_LIMITS.feedbackMax.toLocaleString('en')} حرف.`;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (decision === 'REJECTED') setConfirmReject(true);
    else send();
  };

  return (
    <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="grade-heading">
      <div className="flex items-center justify-between gap-2">
        <h2 id="grade-heading" className="text-base font-bold text-foreground">
          التقييم
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(true);
              setSaved(false);
            }}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden /> تعديل التقييم
          </button>
        )}
      </div>

      {saved && (
        <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-700 dark:text-emerald-400">
          حُفظ القرار وأُبلغ الطالب.
        </p>
      )}

      {submission.status === 'SUBMITTED' && (
        <div className="space-y-2 rounded-xl bg-muted/50 p-3">
          <p className="text-[11px] text-muted-foreground">علّم التسليم «قيد المراجعة» ليعرف الطالب أن عمله بين يدي مقيّم.</p>
          <button
            type="button"
            onClick={() => startReview.mutate({ status: 'UNDER_REVIEW' })}
            disabled={startReview.isPending || grade.isPending}
            className="flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:opacity-50"
          >
            {startReview.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            بدء المراجعة
          </button>
          {startReview.error && (
            <p role="alert" className="text-[11px] text-destructive">
              {getApiErrorMessage(startReview.error, 'تعذّر تحديث الحالة.')}
            </p>
          )}
        </div>
      )}

      {!editing ? (
        <div className="space-y-2 text-xs">
          {submission.score !== null && (
            <p className="font-bold text-foreground tabular-nums">
              الدرجة: <bdi>{formatScore(submission.score)} / {formatScore(maxScore)}</bdi>
            </p>
          )}
          {submission.feedback ? (
            <p dir="auto" className="rounded-xl bg-muted/50 p-3 leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {submission.feedback}
            </p>
          ) : (
            <p className="text-muted-foreground">بدون ملاحظات.</p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <fieldset className="space-y-2" disabled={grade.isPending}>
            <legend className="mb-2 text-xs font-medium">القرار</legend>
            {DECISIONS.map(({ id, label, hint, icon: Icon, tone }) => (
              <label key={id} className="block cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value={id}
                  checked={decision === id}
                  onChange={() => setDecision(id)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'flex items-start gap-3 rounded-xl border p-3 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-gold hover:bg-muted/30',
                    tone,
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>
                    <span className="block text-xs font-semibold text-foreground">{label}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {decision === 'GRADED' && (
            <div className="space-y-1.5">
              <label htmlFor="grade-score" className="text-xs font-medium">
                الدرجة <span className="text-muted-foreground tabular-nums">(من {formatScore(maxScore)})</span>
              </label>
              <input
                id="grade-score"
                inputMode="decimal"
                dir="ltr"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                disabled={grade.isPending}
                aria-invalid={!!errors.score}
                aria-describedby="grade-score-error"
                className={cn(inputClass, 'w-32 text-left tabular-nums')}
              />
              {errors.score && (
                <p id="grade-score-error" className="text-[11px] text-destructive">
                  {errors.score}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="grade-feedback" className="text-xs font-medium">
              ملاحظات للطالب {decision === 'GRADED' && <span className="text-muted-foreground">(اختياري)</span>}
            </label>
            <textarea
              id="grade-feedback"
              dir="auto"
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={grade.isPending}
              aria-invalid={!!errors.feedback}
              aria-describedby="grade-feedback-error"
              className={cn(inputClass, 'resize-y leading-relaxed')}
            />
            <div className="flex items-start justify-between gap-3">
              {errors.feedback ? (
                <p id="grade-feedback-error" className="text-[11px] text-destructive">
                  {errors.feedback}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {feedback.length.toLocaleString('en')} / {SUBMISSION_LIMITS.feedbackMax.toLocaleString('en')}
              </span>
            </div>
          </div>

          {errors.form && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[11px] text-destructive">
              {errors.form}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={grade.isPending}
              className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-navy-900 shadow-sm hover:bg-gold/90 disabled:opacity-50"
            >
              {grade.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              حفظ وإبلاغ الطالب
            </button>
            {reviewed && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setErrors({});
                }}
                disabled={grade.isPending}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirmReject}
        title="رفض التسليم نهائياً؟"
        description="لن يتمكن الطالب من تسليم محاولة جديدة لهذا الواجب، وسيصله إشعار بالرفض مع ملاحظاتك."
        confirmLabel="رفض نهائي"
        tone="danger"
        onConfirm={send}
        onClose={() => setConfirmReject(false)}
      />
    </section>
  );
}
