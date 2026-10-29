// components/lessons/admin/question-editor.tsx
'use client';

import { useId, useState } from 'react';
import { Check, Loader2, Lock } from 'lucide-react';
import { useAddQuestion, useUpdateQuestion } from '@/hooks/use-admin-nodes';
import { getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { parseScore } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import {
  QUIZ_LIMITS,
  type AdminQuiz,
  type AdminQuizQuestion,
  type CreateQuizQuestionBody,
  type UpdateQuizQuestionBody,
} from '@/types/nodes.contract';

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

type Values = {
  text: string;
  explanation: string;
  points: string;
  options: string[];
  correctIndex: number | null;
};

type FieldErrors = Partial<Record<'text' | 'explanation' | 'points' | 'options', string>>;

function valuesFrom(question?: AdminQuizQuestion): Values {
  if (!question) {
    return { text: '', explanation: '', points: '1', options: Array(QUIZ_LIMITS.optionsPerQuestion).fill(''), correctIndex: null };
  }
  const options = [...question.options].sort((a, b) => a.orderIndex - b.orderIndex);
  const correct = options.findIndex((o) => o.isCorrect);
  return {
    text: question.text,
    explanation: question.explanation ?? '',
    points: String(question.points),
    options: options.map((o) => o.text),
    correctIndex: correct >= 0 ? correct : null,
  };
}

function validate(v: Values): FieldErrors {
  const errors: FieldErrors = {};
  const text = v.text.trim();
  if (!text) errors.text = 'نص السؤال مطلوب.';
  else if (text.length > QUIZ_LIMITS.questionTextMax) errors.text = `نص السؤال أطول من ${QUIZ_LIMITS.questionTextMax} حرف.`;
  if (v.explanation.trim().length > QUIZ_LIMITS.explanationMax) errors.explanation = `الشرح أطول من ${QUIZ_LIMITS.explanationMax} حرف.`;
  if (parseScore(v.points, { min: 0, exclusiveMin: true, max: QUIZ_LIMITS.pointsMax }) === null) {
    errors.points = `أدخل رقماً أكبر من 0 وحتى ${QUIZ_LIMITS.pointsMax}، بمنزلتين عشريتين على الأكثر.`;
  }
  if (v.options.some((o) => !o.trim())) errors.options = `اكتب نص الخيارات الأربعة.`;
  else if (v.options.some((o) => o.trim().length > QUIZ_LIMITS.optionTextMax)) errors.options = `نص الخيار أطول من ${QUIZ_LIMITS.optionTextMax} حرف.`;
  else if (v.correctIndex === null) errors.options = 'حدّد الإجابة الصحيحة.';
  return errors;
}

function optionsBody(v: Values): CreateQuizQuestionBody['options'] {
  return v.options.map((text, i) => ({ text: text.trim(), isCorrect: i === v.correctIndex }));
}

/** Only the changed fields. Options go as all 4 (the server updates them in place by position). */
function buildUpdate(original: Values, v: Values): UpdateQuizQuestionBody {
  const body: UpdateQuizQuestionBody = {};
  if (v.text.trim() !== original.text.trim()) body.text = v.text.trim();
  if (v.explanation.trim() !== original.explanation.trim()) body.explanation = v.explanation.trim() || null;
  if (Number(v.points) !== Number(original.points)) body.points = Number(v.points);
  const optionsChanged =
    v.correctIndex !== original.correctIndex || v.options.some((o, i) => o.trim() !== original.options[i]?.trim());
  if (optionsChanged) body.options = optionsBody(v);
  return body;
}

/** Server details: "text", "points", "options", "options.2.text"... */
function serverFieldErrors(details: Record<string, string>): FieldErrors {
  const optionKey = Object.keys(details).find((k) => k === 'options' || k.startsWith('options.'));
  return {
    text: details.text,
    explanation: details.explanation,
    points: details.points,
    options: optionKey ? details[optionKey] : undefined,
  };
}

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold aria-invalid:border-destructive disabled:opacity-60';

interface QuestionEditorProps {
  quiz: AdminQuiz;
  /** Omit to add a new question. */
  question?: AdminQuizQuestion;
  /** Position shown in the heading (1-based). */
  number: number;
  onDone: () => void;
}

export function QuestionEditor({ quiz, question, number, onDone }: QuestionEditorProps) {
  const uid = useId();
  const original = valuesFrom(question);
  const [values, setValues] = useState(original);
  const [errors, setErrors] = useState<FieldErrors>({});
  const add = useAddQuestion(quiz.id);
  const update = useUpdateQuestion();
  const mutation = question ? update : add;
  // After the first attempt, points and the correct option are frozen (texts stay editable).
  const locked = quiz.isLocked && !!question;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  const setOption = (index: number, text: string) =>
    setValues((prev) => ({ ...prev, options: prev.options.map((o, i) => (i === index ? text : o)) }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    const onError = (error: unknown) => setErrors(serverFieldErrors(getApiErrorDetails(error)));
    if (question) {
      const body = buildUpdate(original, values);
      if (Object.keys(body).length === 0) return onDone();
      update.mutate({ questionId: question.id, body }, { onSuccess: onDone, onError });
    } else {
      add.mutate(
        {
          text: values.text.trim(),
          explanation: values.explanation.trim() || null,
          points: Number(values.points),
          options: optionsBody(values),
        },
        { onSuccess: onDone, onError },
      );
    }
  };

  const generalError = mutation.error ? getApiErrorMessage(mutation.error, 'تعذّر حفظ السؤال.') : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl border-2 border-gold/30 bg-card p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground">{question ? `تعديل السؤال ${number}` : `سؤال جديد (${number})`}</h3>

      {locked && (
        <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[11px] text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          قدّم الطلاب محاولات على هذا الاختبار: يمكنك تعديل النصوص والشرح فقط، أما الدرجة والإجابة الصحيحة فمقفلتان.
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor={`${uid}-text`} className="text-xs font-medium">
          نص السؤال
        </label>
        <textarea
          id={`${uid}-text`}
          rows={2}
          dir="auto"
          value={values.text}
          maxLength={QUIZ_LIMITS.questionTextMax}
          onChange={(e) => set('text', e.target.value)}
          aria-invalid={!!errors.text}
          className={cn(inputClass, 'resize-y')}
        />
        {errors.text && <p className="text-[11px] text-destructive">{errors.text}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs font-medium">الخيارات (اختر الإجابة الصحيحة)</legend>
        {values.options.map((option, i) => {
          const isCorrect = values.correctIndex === i;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-2 rounded-xl border p-1.5 transition-colors',
                isCorrect ? 'border-emerald-500/40 bg-emerald-500/5' : 'bg-background',
              )}
            >
              <label
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold',
                  locked ? 'cursor-not-allowed' : 'cursor-pointer',
                  isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
                )}
              >
                <input
                  type="radio"
                  name={`${uid}-correct`}
                  checked={isCorrect}
                  disabled={locked}
                  onChange={() => set('correctIndex', i)}
                  className="h-3.5 w-3.5 accent-emerald-600"
                  aria-label={`الخيار ${OPTION_LETTERS[i]} هو الإجابة الصحيحة`}
                />
                {OPTION_LETTERS[i]}
              </label>
              <input
                value={option}
                dir="auto"
                maxLength={QUIZ_LIMITS.optionTextMax}
                onChange={(e) => setOption(i, e.target.value)}
                aria-label={`نص الخيار ${OPTION_LETTERS[i]}`}
                aria-invalid={!!errors.options && !option.trim()}
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-gold aria-invalid:ring-1 aria-invalid:ring-destructive"
              />
              {isCorrect && <Check className="ml-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />}
            </div>
          );
        })}
        {errors.options && <p className="text-[11px] text-destructive">{errors.options}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div className="space-y-1">
          <label htmlFor={`${uid}-points`} className="text-xs font-medium">
            الدرجة
          </label>
          <input
            id={`${uid}-points`}
            type="number"
            min={0.01}
            max={QUIZ_LIMITS.pointsMax}
            step={0.01}
            value={values.points}
            disabled={locked}
            onChange={(e) => set('points', e.target.value)}
            aria-invalid={!!errors.points}
            className={cn(inputClass, 'tabular-nums')}
          />
          {errors.points && <p className="text-[11px] text-destructive">{errors.points}</p>}
        </div>
        <div className="space-y-1">
          <label htmlFor={`${uid}-explanation`} className="text-xs font-medium">
            شرح الإجابة (اختياري)
          </label>
          <textarea
            id={`${uid}-explanation`}
            rows={2}
            dir="auto"
            value={values.explanation}
            maxLength={QUIZ_LIMITS.explanationMax}
            onChange={(e) => set('explanation', e.target.value)}
            aria-invalid={!!errors.explanation}
            className={cn(inputClass, 'resize-y')}
          />
          <p className="text-[11px] text-muted-foreground">يظهر للطلاب بعد التسليم إذا كان عرض الإجابات الصحيحة مفعّلاً.</p>
          {errors.explanation && <p className="text-[11px] text-destructive">{errors.explanation}</p>}
        </div>
      </div>

      {generalError && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {generalError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          disabled={mutation.isPending}
          className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90 disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {question ? 'حفظ السؤال' : 'إضافة السؤال'}
        </button>
      </div>
    </form>
  );
}
