// components/lessons/admin/quiz-settings-form.tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Lock, Save } from 'lucide-react';
import { useUpdateQuiz } from '@/hooks/use-admin-nodes';
import { getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { formatScore, parseScore } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import { QUIZ_LIMITS, type AdminQuiz, type UpdateQuizBody } from '@/types/nodes.contract';

const MAX_ATTEMPTS_LIMIT = 100;

type Values = {
  title: string;
  description: string;
  passingScore: string;
  unlimitedAttempts: boolean;
  maxAttempts: string;
  showCorrectAnswers: boolean;
};

type FieldErrors = Partial<Record<'title' | 'description' | 'passingScore' | 'maxAttempts', string>>;

function valuesFrom(quiz: AdminQuiz): Values {
  return {
    title: quiz.title,
    description: quiz.description ?? '',
    passingScore: String(quiz.passingScore),
    unlimitedAttempts: quiz.maxAttempts === null,
    maxAttempts: String(quiz.maxAttempts ?? 3),
    showCorrectAnswers: quiz.showCorrectAnswers,
  };
}

function validate(v: Values, quiz: AdminQuiz): FieldErrors {
  const errors: FieldErrors = {};
  const title = v.title.trim();
  if (!title) errors.title = 'العنوان مطلوب.';
  else if (title.length > QUIZ_LIMITS.titleMax) errors.title = `العنوان أطول من ${QUIZ_LIMITS.titleMax} حرف.`;
  if (v.description.trim().length > QUIZ_LIMITS.descriptionMax) errors.description = `الوصف أطول من ${QUIZ_LIMITS.descriptionMax} حرف.`;

  const passing = parseScore(v.passingScore);
  if (passing === null) errors.passingScore = 'أدخل رقماً من 0 فأكثر، بمنزلتين عشريتين على الأكثر.';
  else if (quiz.isPublished && passing > quiz.totalScore) {
    errors.passingScore = `الاختبار منشور: يجب ألا تتجاوز درجة النجاح مجموع الدرجات (${formatScore(quiz.totalScore)}).`;
  }

  if (!v.unlimitedAttempts) {
    const n = Number(v.maxAttempts);
    if (!Number.isInteger(n) || n < 1 || n > MAX_ATTEMPTS_LIMIT) errors.maxAttempts = `أدخل عدداً صحيحاً من 1 إلى ${MAX_ATTEMPTS_LIMIT}.`;
  }
  return errors;
}

function buildUpdate(original: Values, v: Values): UpdateQuizBody {
  const body: UpdateQuizBody = {};
  if (v.title.trim() !== original.title.trim()) body.title = v.title.trim();
  if (v.description.trim() !== original.description.trim()) body.description = v.description.trim() || null;
  if (Number(v.passingScore) !== Number(original.passingScore)) body.passingScore = Number(v.passingScore);
  const maxAttempts = v.unlimitedAttempts ? null : Number(v.maxAttempts);
  const originalMax = original.unlimitedAttempts ? null : Number(original.maxAttempts);
  if (maxAttempts !== originalMax) body.maxAttempts = maxAttempts;
  if (v.showCorrectAnswers !== original.showCorrectAnswers) body.showCorrectAnswers = v.showCorrectAnswers;
  return body;
}

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold aria-invalid:border-destructive disabled:opacity-60';

export function QuizSettingsForm({ quiz }: { quiz: AdminQuiz }) {
  const [original, setOriginal] = useState(() => valuesFrom(quiz));
  const [values, setValues] = useState(original);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const update = useUpdateQuiz(quiz.id);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const body = buildUpdate(original, values);
  const dirty = Object.keys(body).length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values, quiz);
    setErrors(found);
    if (Object.values(found).some(Boolean) || !dirty) return;

    update.mutate(body, {
      onSuccess: (fresh) => {
        const next = valuesFrom(fresh);
        setOriginal(next);
        setValues(next);
        setSaved(true);
      },
      onError: (error) => {
        const d = getApiErrorDetails(error);
        setErrors({ title: d.title, description: d.description, passingScore: d.passingScore, maxAttempts: d.maxAttempts });
      },
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="quiz-settings-heading">
      <h2 id="quiz-settings-heading" className="text-base font-bold text-foreground">
        إعدادات الاختبار
      </h2>

      <div className="space-y-1">
        <label htmlFor="quiz-title" className="text-xs font-medium">
          عنوان الاختبار
        </label>
        <input
          id="quiz-title"
          value={values.title}
          maxLength={QUIZ_LIMITS.titleMax}
          onChange={(e) => set('title', e.target.value)}
          aria-invalid={!!errors.title}
          className={inputClass}
        />
        {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="quiz-description" className="text-xs font-medium">
          تعليمات للطلاب (اختياري)
        </label>
        <textarea
          id="quiz-description"
          rows={3}
          value={values.description}
          maxLength={QUIZ_LIMITS.descriptionMax}
          onChange={(e) => set('description', e.target.value)}
          aria-invalid={!!errors.description}
          className={cn(inputClass, 'resize-y')}
        />
        {errors.description && <p className="text-[11px] text-destructive">{errors.description}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="quiz-passing" className="flex items-center gap-1.5 text-xs font-medium">
            درجة النجاح {quiz.isLocked && <Lock className="h-3 w-3 text-muted-foreground" aria-label="مقفلة" />}
          </label>
          <input
            id="quiz-passing"
            type="number"
            min={0}
            step={0.01}
            value={values.passingScore}
            disabled={quiz.isLocked}
            onChange={(e) => set('passingScore', e.target.value)}
            aria-invalid={!!errors.passingScore}
            className={cn(inputClass, 'tabular-nums')}
          />
          <p className="text-[11px] text-muted-foreground">
            {quiz.isLocked
              ? 'مقفلة بعد محاولات الطلاب حتى لا تتغير نتائجهم.'
              : `من مجموع ${formatScore(quiz.totalScore)} درجة. ينجح الطالب إذا بلغ هذه الدرجة.`}
          </p>
          {errors.passingScore && <p className="text-[11px] text-destructive">{errors.passingScore}</p>}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium">عدد المحاولات المسموح</span>
          <label className="flex w-fit cursor-pointer items-center gap-2 py-1 text-xs">
            <input
              type="checkbox"
              checked={values.unlimitedAttempts}
              onChange={(e) => set('unlimitedAttempts', e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            غير محدود
          </label>
          {!values.unlimitedAttempts && (
            <input
              type="number"
              min={1}
              max={MAX_ATTEMPTS_LIMIT}
              step={1}
              aria-label="الحد الأقصى للمحاولات"
              value={values.maxAttempts}
              onChange={(e) => set('maxAttempts', e.target.value)}
              aria-invalid={!!errors.maxAttempts}
              className={cn(inputClass, 'tabular-nums')}
            />
          )}
          {errors.maxAttempts && <p className="text-[11px] text-destructive">{errors.maxAttempts}</p>}
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-2xl border bg-muted/30 p-4 text-xs">
        <input
          type="checkbox"
          checked={values.showCorrectAnswers}
          onChange={(e) => set('showCorrectAnswers', e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-gold"
        />
        <span className="space-y-0.5">
          <span className="block font-medium text-foreground">عرض الإجابات الصحيحة بعد التسليم</span>
          <span className="block text-[11px] text-muted-foreground">يرى الطالب الإجابة الصحيحة وشرحها لكل سؤال في نتيجته.</span>
        </span>
      </label>

      {update.error && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {getApiErrorMessage(update.error, 'تعذّر حفظ الإعدادات.')}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && !dirty && (
          <span role="status" className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> تم الحفظ
          </span>
        )}
        <button
          type="submit"
          disabled={!dirty || update.isPending}
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90 disabled:opacity-50"
        >
          {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          حفظ الإعدادات
        </button>
      </div>
    </form>
  );
}
