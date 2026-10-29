// components/assignments/admin/assignment-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, Save } from 'lucide-react';
import { useAssignmentTargets, useCreateAssignment, useUpdateAssignment } from '@/hooks/use-admin-assignments';
import { getAssignmentErrorMessage } from '@/lib/assignment-errors';
import { fromLocalInputValue, localTimeZone, toLocalInputValue } from '@/lib/assignment-format';
import { SUBMISSION_TYPE_LABELS } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { isAssignmentRequestError } from '@/services/assignments-admin-service';
import type { SubmissionType } from '@/types/assignments.contract';
import {
  ASSIGNMENT_LIMITS,
  type AdminAssignmentDetail,
  type CreateAssignmentBody,
  type UpdateAssignmentBody,
} from '@/types/assignments.admin.contract';

const SUBMISSION_TYPES = Object.keys(SUBMISSION_TYPE_LABELS) as SubmissionType[];

interface FormValues {
  programId: string;
  trackId: string;
  moduleId: string;
  title: string;
  instructions: string;
  allowedType: SubmissionType;
  /** Kept as text so partial input ("12.") does not get coerced while typing. */
  maxScore: string;
  /** `<input type="datetime-local">` value in local time; '' = no deadline. */
  dueDate: string;
  isMandatory: boolean;
}

type FieldErrors = Partial<Record<keyof FormValues, string>>;

function initialValues(assignment?: AdminAssignmentDetail): FormValues {
  if (!assignment) {
    return {
      programId: '',
      trackId: '',
      moduleId: '',
      title: '',
      instructions: '',
      allowedType: 'URL_LINK',
      maxScore: '100',
      dueDate: '',
      isMandatory: true,
    };
  }
  return {
    programId: assignment.program.id,
    trackId: assignment.track.id,
    moduleId: assignment.module.id,
    title: assignment.title,
    instructions: assignment.instructions,
    allowedType: assignment.allowedType,
    maxScore: String(assignment.maxScore),
    dueDate: toLocalInputValue(assignment.dueDate),
    isMandatory: assignment.isMandatory,
  };
}

/** Mirrors the server rules (spec §6.1) so most mistakes are caught before a round trip. */
function validate(values: FormValues, original: FormValues | null): FieldErrors {
  const errors: FieldErrors = {};
  const title = values.title.trim();
  const instructions = values.instructions.trim();

  if (!values.moduleId) errors.moduleId = 'اختر الوحدة التي يتبع لها الواجب.';
  if (title.length < ASSIGNMENT_LIMITS.titleMin || title.length > ASSIGNMENT_LIMITS.titleMax) {
    errors.title = `يجب أن يكون العنوان بين ${ASSIGNMENT_LIMITS.titleMin} و${ASSIGNMENT_LIMITS.titleMax} حرفاً.`;
  }
  if (instructions.length < 1) errors.instructions = 'اكتب تعليمات الواجب.';
  else if (instructions.length > ASSIGNMENT_LIMITS.instructionsMax) {
    errors.instructions = `يجب ألا تتجاوز التعليمات ${ASSIGNMENT_LIMITS.instructionsMax.toLocaleString('en')} حرف.`;
  }

  const score = Number(values.maxScore);
  if (!/^\d+(\.\d{1,2})?$/.test(values.maxScore.trim()) || score <= 0 || score > ASSIGNMENT_LIMITS.maxScoreMax) {
    errors.maxScore = `أدخل رقماً أكبر من 0 وحتى ${ASSIGNMENT_LIMITS.maxScoreMax} بخانتين عشريتين كحد أقصى.`;
  }

  // A past deadline is only an error when it is being changed (spec §6.4).
  const dueChanged = !original || values.dueDate !== original.dueDate;
  const dueIso = fromLocalInputValue(values.dueDate);
  if (values.dueDate && !dueIso) errors.dueDate = 'تاريخ غير صالح.';
  else if (dueChanged && dueIso && new Date(dueIso).getTime() <= Date.now()) {
    errors.dueDate = 'يجب أن يكون الموعد النهائي في المستقبل.';
  }

  return errors;
}

function buildCreateBody(values: FormValues): CreateAssignmentBody {
  return {
    moduleId: values.moduleId,
    title: values.title.trim(),
    instructions: values.instructions.trim(),
    allowedType: values.allowedType,
    maxScore: Number(values.maxScore),
    dueDate: fromLocalInputValue(values.dueDate),
    isMandatory: values.isMandatory,
  };
}

/** Only the fields that changed, so untouched values (e.g. a passed deadline) are never re-validated. */
function buildUpdateBody(values: FormValues, original: FormValues): UpdateAssignmentBody {
  const body: UpdateAssignmentBody = {};
  if (values.title.trim() !== original.title.trim()) body.title = values.title.trim();
  if (values.instructions.trim() !== original.instructions.trim()) body.instructions = values.instructions.trim();
  if (values.allowedType !== original.allowedType) body.allowedType = values.allowedType;
  if (Number(values.maxScore) !== Number(original.maxScore)) body.maxScore = Number(values.maxScore);
  if (values.dueDate !== original.dueDate) body.dueDate = fromLocalInputValue(values.dueDate);
  if (values.isMandatory !== original.isMandatory) body.isMandatory = values.isMandatory;
  return body;
}

const inputClass =
  'w-full rounded-xl border bg-background px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-gold disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive';

function Field({ label, htmlFor, error, hint, children }: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-[11px] text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

interface AssignmentFormProps {
  /** Omit to create a new assignment. */
  assignment?: AdminAssignmentDetail;
}

export function AssignmentForm({ assignment }: AssignmentFormProps) {
  const router = useRouter();
  const isEditing = !!assignment;
  // Last saved values: the baseline for the partial update body.
  const [original, setOriginal] = useState(() => (assignment ? initialValues(assignment) : null));
  const [values, setValues] = useState<FormValues>(() => initialValues(assignment));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const targets = useAssignmentTargets();
  const create = useCreateAssignment();
  const update = useUpdateAssignment(assignment?.id ?? '');
  const isPending = create.isPending || update.isPending;

  const isArchived = assignment?.status === 'ARCHIVED';
  const typeLocked = (assignment?.submissionsCount ?? 0) > 0;

  const programs = targets.data?.programs.filter((p) => p.status !== 'ARCHIVED') ?? [];
  const tracks = programs.find((p) => p.id === values.programId)?.tracks ?? [];
  const modules = tracks.find((t) => t.id === values.trackId)?.modules ?? [];

  const set = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaved(false);
  };

  const onServerError = (error: unknown) => {
    if (isAssignmentRequestError(error) && error.code === 'VALIDATION_FAILED' && error.details) {
      setErrors(error.details as FieldErrors);
    }
    if (isAssignmentRequestError(error) && error.code === 'ALLOWED_TYPE_LOCKED') {
      setErrors({ allowedType: error.userMessage });
    }
    if (isAssignmentRequestError(error) && error.code === 'MAX_SCORE_BELOW_EXISTING_SCORES') {
      setErrors({ maxScore: error.userMessage });
    }
    setFormError(getAssignmentErrorMessage(error));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaved(false);

    const found = validate(values, original);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    if (!original || !assignment) {
      create.mutate(buildCreateBody(values), {
        onSuccess: (created) => router.push(`/admin/assignments/${created.id}`),
        onError: onServerError,
      });
      return;
    }

    const body = buildUpdateBody(values, original);
    if (Object.keys(body).length === 0) {
      setSaved(true);
      return;
    }
    const submitted = values;
    update.mutate(body, {
      onSuccess: () => {
        setOriginal(submitted);
        setSaved(true);
      },
      onError: onServerError,
    });
  };

  const disabled = isPending || isArchived;
  const timeZone = localTimeZone();

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
      <h2 className="text-base font-bold text-foreground">{isEditing ? 'بيانات الواجب' : 'بيانات الواجب الجديد'}</h2>

      {isArchived && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          هذا الواجب مؤرشف ولا يمكن تعديله. استعده أولاً لتتمكن من التعديل.
        </p>
      )}

      {/* Where the assignment lives: decides the program and therefore which students see it. */}
      {isEditing ? (
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Lock className="h-3 w-3 text-muted-foreground" aria-hidden /> الموقع في المنهج
          </span>
          <p className="rounded-xl border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            {assignment.program.title} ← {assignment.track.title} ← {assignment.module.title}
          </p>
          <p className="text-[11px] text-muted-foreground">لا يمكن نقل الواجب إلى وحدة أخرى بعد إنشائه.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="البرنامج" htmlFor="programId">
            <select
              id="programId"
              className={inputClass}
              value={values.programId}
              disabled={disabled || targets.isPending}
              onChange={(e) => setValues((prev) => ({ ...prev, programId: e.target.value, trackId: '', moduleId: '' }))}
            >
              <option value="">{targets.isPending ? 'جارٍ التحميل…' : 'اختر البرنامج'}</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="المسار" htmlFor="trackId">
            <select
              id="trackId"
              className={inputClass}
              value={values.trackId}
              disabled={disabled || !values.programId}
              onChange={(e) => setValues((prev) => ({ ...prev, trackId: e.target.value, moduleId: '' }))}
            >
              <option value="">اختر المسار</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الوحدة" htmlFor="moduleId" error={errors.moduleId}>
            <select
              id="moduleId"
              className={inputClass}
              value={values.moduleId}
              disabled={disabled || !values.trackId}
              aria-invalid={!!errors.moduleId}
              onChange={(e) => set('moduleId', e.target.value)}
            >
              <option value="">اختر الوحدة</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </Field>
          {targets.isError && (
            <p className="text-[11px] text-destructive sm:col-span-3">تعذّر تحميل قائمة البرامج. أعد تحميل الصفحة.</p>
          )}
        </div>
      )}

      <Field label="عنوان الواجب" htmlFor="title" error={errors.title}>
        <input
          id="title"
          type="text"
          className={inputClass}
          value={values.title}
          maxLength={ASSIGNMENT_LIMITS.titleMax}
          disabled={disabled}
          aria-invalid={!!errors.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="مثال: بناء واجهة تسجيل الدخول"
        />
      </Field>

      <Field
        label="التعليمات"
        htmlFor="instructions"
        error={errors.instructions}
        hint={`${values.instructions.length.toLocaleString('en')} / ${ASSIGNMENT_LIMITS.instructionsMax.toLocaleString('en')} · نص عادي، يمكن إرفاق ملفات للمحتوى الأغنى.`}
      >
        <textarea
          id="instructions"
          rows={8}
          className={cn(inputClass, 'resize-y leading-relaxed')}
          value={values.instructions}
          maxLength={ASSIGNMENT_LIMITS.instructionsMax}
          disabled={disabled}
          aria-invalid={!!errors.instructions}
          onChange={(e) => set('instructions', e.target.value)}
          placeholder="اشرح المطلوب من الطالب بالتفصيل…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="نوع التسليم"
          htmlFor="allowedType"
          error={errors.allowedType}
          hint={typeLocked ? 'لا يمكن تغيير نوع التسليم لأن الطلاب بدأوا بالتسليم.' : undefined}
        >
          <select
            id="allowedType"
            className={inputClass}
            value={values.allowedType}
            disabled={disabled || typeLocked}
            aria-invalid={!!errors.allowedType}
            onChange={(e) => set('allowedType', e.target.value as SubmissionType)}
          >
            {SUBMISSION_TYPES.map((t) => (
              <option key={t} value={t}>
                {SUBMISSION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="الدرجة العظمى" htmlFor="maxScore" error={errors.maxScore}>
          <input
            id="maxScore"
            type="number"
            inputMode="decimal"
            min={0.01}
            max={ASSIGNMENT_LIMITS.maxScoreMax}
            step={0.01}
            dir="ltr"
            className={cn(inputClass, 'text-left')}
            value={values.maxScore}
            disabled={disabled}
            aria-invalid={!!errors.maxScore}
            onChange={(e) => set('maxScore', e.target.value)}
          />
        </Field>

        <Field
          label="الموعد النهائي (اختياري)"
          htmlFor="dueDate"
          error={errors.dueDate}
          hint={
            <>
              بتوقيتك المحلي: <bdi dir="ltr">{timeZone}</bdi>
            </>
          }
        >
          <div className="flex gap-2">
            <input
              id="dueDate"
              type="datetime-local"
              dir="ltr"
              className={cn(inputClass, 'text-left')}
              value={values.dueDate}
              disabled={disabled}
              aria-invalid={!!errors.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
            />
            {values.dueDate && !disabled && (
              <button
                type="button"
                onClick={() => set('dueDate', '')}
                className="shrink-0 rounded-xl border px-3 text-[11px] font-semibold hover:bg-muted"
              >
                بدون موعد
              </button>
            )}
          </div>
        </Field>

        <div className="flex items-center gap-3 self-center pt-4">
          <input
            id="isMandatory"
            type="checkbox"
            className="size-4 accent-[var(--color-gold)]"
            checked={values.isMandatory}
            disabled={disabled}
            onChange={(e) => set('isMandatory', e.target.checked)}
          />
          <label htmlFor="isMandatory" className="text-xs font-medium text-foreground">
            واجب إلزامي لإكمال البرنامج
          </label>
        </div>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
        {saved && (
          <span className="me-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400" role="status">
            <CheckCircle2 className="h-4 w-4" /> تم حفظ التعديلات
          </span>
        )}
        {!isEditing && (
          <p className="me-auto text-[11px] text-muted-foreground">
            يُحفظ الواجب كمسودة. يمكنك إرفاق الملفات ونشره بعد الحفظ.
          </p>
        )}
        <button
          type="button"
          onClick={() => router.push('/admin/assignments')}
          className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted"
        >
          {isEditing ? 'العودة للقائمة' : 'إلغاء'}
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isEditing ? 'حفظ التعديلات' : 'حفظ كمسودة'}
        </button>
      </div>
    </form>
  );
}
