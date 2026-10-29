// components/submissions/student/hand-in-panel.tsx
'use client';

import { useRef, useState } from 'react';
import { isCancel } from 'axios';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MessageSquareText,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreBar } from '@/components/assignments/student/assignment-card';
import {
  LateBadge,
  SubmissionContentView,
  SubmissionStatusBadge,
  fileIconFor,
} from '@/components/submissions/submission-parts';
import { useMySubmission, useSubmitAssignment } from '@/hooks/use-submissions';
import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime, formatFileSize } from '@/lib/assignment-format';
import { isHttpUrl } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import { SUBMISSION_FILE_ACCEPT, validateSubmissionFile } from '@/services/submissions-service';
import {
  SUBMISSION_LIMITS,
  SUBMISSION_RULES,
  type MySubmissionResponse,
  type SubmitAssignmentBody,
  type SubmitBlockReason,
  type SubmissionType,
} from '@/types/submissions.contract';

const BLOCK_REASONS: Record<SubmitBlockReason, { icon: typeof Clock; text: string }> = {
  AWAITING_REVIEW: {
    icon: Clock,
    text: 'سلّمت هذا الواجب وهو بانتظار التقييم. إذا طلب المقيّم تعديلات ستتمكن من تسليم محاولة جديدة.',
  },
  GRADED: { icon: CheckCircle2, text: 'تم تقييم تسليمك، ولا يمكن تسليم محاولة جديدة.' },
  REJECTED: { icon: Lock, text: 'رُفض تسليمك، ولا يمكن تسليم محاولة جديدة.' },
};

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold aria-invalid:border-destructive';

type FieldErrors = Partial<Record<'text' | 'links' | 'files' | 'form', string>>;

interface Upload {
  progress: number;
  controller: AbortController;
}

/** Text is the answer for TEXT_CONTENT and an optional note for the other types. */
function textLabelFor(type: SubmissionType): string {
  return type === 'TEXT_CONTENT' ? 'إجابتك' : 'ملاحظة للمقيّم (اختياري)';
}

/** Server field names ("links.0", "files") -> the form's fields. */
function mapServerErrors(details: Record<string, string>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, message] of Object.entries(details)) {
    const key = field.split('.')[0];
    if (key === 'text' || key === 'links' || key === 'files') errors[key] ??= message;
    else errors.form ??= message;
  }
  return errors;
}

function HandInForm({ data }: { data: MySubmissionResponse }) {
  const type = data.allowedType;
  const rules = SUBMISSION_RULES[type];
  const maxLinks = rules.links[1];
  const maxFiles = rules.files[1];

  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [links, setLinks] = useState<string[]>(type === 'URL_LINK' ? [''] : []);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [now] = useState(() => Date.now());

  const submit = useSubmitAssignment(data.assignmentId);
  const busy = submit.isPending;
  const isLate = !!data.dueDate && new Date(data.dueDate).getTime() < now;
  const nextAttempt = (data.latest?.attemptNumber ?? 0) + 1;

  const addFiles = (picked: FileList | null) => {
    if (!picked) return;
    const rejected: string[] = [];
    const next = [...files];
    for (const file of Array.from(picked)) {
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      if (next.length >= maxFiles) {
        rejected.push(`${file.name}: الحد الأقصى ${maxFiles} ملفات.`);
        continue;
      }
      const problem = validateSubmissionFile(file);
      if (problem) rejected.push(`${file.name}: ${problem}`);
      else next.push(file);
    }
    setFiles(next);
    setRejectedFiles(rejected);
    setErrors((prev) => ({ ...prev, files: undefined }));
  };

  const validate = (): { body: SubmitAssignmentBody; errors: FieldErrors } => {
    const found: FieldErrors = {};
    const note = text.trim();
    const cleanLinks = links.map((l) => l.trim()).filter(Boolean);

    if (rules.textRequired && !note) found.text = 'اكتب إجابتك.';
    else if (note.length > SUBMISSION_LIMITS.textMax) found.text = `النص أطول من ${SUBMISSION_LIMITS.textMax.toLocaleString('en')} حرف.`;

    if (cleanLinks.some((l) => !isHttpUrl(l) || l.length > SUBMISSION_LIMITS.urlMax)) {
      found.links = 'أدخل روابط صالحة تبدأ بـ https://';
    } else if (cleanLinks.length < rules.links[0]) {
      found.links = 'أضف رابط الحل.';
    }

    if (files.length < rules.files[0]) found.files = 'أرفق ملفاً واحداً على الأقل.';
    if (type === 'MULTIMEDIA' && cleanLinks.length === 0 && files.length === 0) {
      found.form = 'أضف رابطاً أو ملفاً واحداً على الأقل.';
    }

    return {
      body: { ...(note && { text: note }), ...(cleanLinks.length > 0 && { links: cleanLinks }) },
      errors: found,
    };
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { errors: found } = validate();
    setErrors(found);
    if (Object.keys(found).length === 0) setConfirming(true);
  };

  const send = () => {
    setConfirming(false);
    const { body } = validate();
    const controller = new AbortController();
    if (files.length > 0) setUpload({ progress: 0, controller });
    submit.mutate(
      {
        body,
        files,
        signal: controller.signal,
        onProgress: (progress) => setUpload((prev) => (prev ? { ...prev, progress } : prev)),
      },
      {
        onError: (error) => {
          if (isCancel(error)) return;
          const fieldErrors = mapServerErrors(getApiErrorDetails(error));
          if (getApiErrorCode(error) !== 'VALIDATION_FAILED' || Object.keys(fieldErrors).length === 0) {
            fieldErrors.form = getApiErrorMessage(error, 'تعذّر تسليم الحل. حاول مرة أخرى.');
          }
          setErrors(fieldErrors);
        },
        onSettled: () => setUpload(null),
      },
    );
  };

  const fieldError = (key: keyof FieldErrors, id: string) =>
    errors[key] && (
      <p id={id} className="text-[11px] text-destructive">
        {errors[key]}
      </p>
    );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {nextAttempt > 1 && <p className="text-[11px] font-semibold text-gold">المحاولة رقم {nextAttempt}</p>}

      {type === 'URL_LINK' && (
        <div className="space-y-1.5">
          <label htmlFor="hand-in-link" className="text-xs font-medium">
            رابط الحل
          </label>
          <input
            id="hand-in-link"
            type="url"
            dir="ltr"
            placeholder="https://..."
            value={links[0] ?? ''}
            onChange={(e) => setLinks([e.target.value])}
            disabled={busy}
            aria-invalid={!!errors.links}
            aria-describedby="hand-in-link-error"
            className={cn(inputClass, 'text-left')}
          />
          {fieldError('links', 'hand-in-link-error')}
        </div>
      )}

      {type === 'MULTIMEDIA' && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium">
            الروابط <span className="text-muted-foreground">(حتى {maxLinks})</span>
          </legend>
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                dir="ltr"
                placeholder="https://..."
                aria-label={`الرابط ${i + 1}`}
                value={link}
                onChange={(e) => setLinks((prev) => prev.map((l, j) => (j === i ? e.target.value : l)))}
                disabled={busy}
                aria-invalid={!!errors.links}
                className={cn(inputClass, 'text-left')}
              />
              <button
                type="button"
                onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}
                disabled={busy}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`حذف الرابط ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {links.length < maxLinks && (
            <button
              type="button"
              onClick={() => setLinks((prev) => [...prev, ''])}
              disabled={busy}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-gold hover:underline disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden /> إضافة رابط
            </button>
          )}
          {fieldError('links', 'hand-in-links-error')}
        </fieldset>
      )}

      {maxFiles > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium">
            الملفات{' '}
            <span className="text-muted-foreground tabular-nums">
              ({files.length} / {maxFiles})
            </span>
          </p>
          {files.length > 0 && (
            <ul className="space-y-2">
              {files.map((file, i) => {
                const Icon = fileIconFor(file.type);
                return (
                  <li key={`${file.name}-${file.size}`} className="flex items-center gap-3 rounded-xl border bg-background p-3">
                    <Icon className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">
                        <bdi>{file.name}</bdi>
                      </span>
                      <span className="block text-[11px] text-muted-foreground tabular-nums">{formatFileSize(file.size)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      disabled={busy}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`إزالة ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {files.length < maxFiles && !busy && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                addFiles(e.dataTransfer.files);
              }}
              aria-describedby="hand-in-files-error"
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold',
                dragging ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 hover:bg-muted/30',
                errors.files && 'border-destructive/60',
              )}
            >
              <UploadCloud className="h-7 w-7 text-gold" aria-hidden />
              <p className="text-xs font-semibold text-foreground">اسحب الملفات هنا أو انقر للاختيار</p>
              <p className="text-[11px] text-muted-foreground">
                PDF, Word, صور (PNG, JPG, WEBP) · حتى {SUBMISSION_LIMITS.maxFileBytes / (1024 * 1024)} ميجابايت للملف
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={SUBMISSION_FILE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = ''; // allow picking the same file again
                }}
              />
            </div>
          )}
          {rejectedFiles.length > 0 && (
            <ul role="alert" className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[11px] text-destructive">
              {rejectedFiles.map((message) => (
                <li key={message}>
                  <bdi>{message}</bdi>
                </li>
              ))}
            </ul>
          )}
          {fieldError('files', 'hand-in-files-error')}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="hand-in-text" className="text-xs font-medium">
          {textLabelFor(type)}
        </label>
        <textarea
          id="hand-in-text"
          dir="auto"
          rows={type === 'TEXT_CONTENT' ? 10 : 3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          aria-invalid={!!errors.text}
          aria-describedby="hand-in-text-error"
          className={cn(inputClass, 'resize-y leading-relaxed')}
        />
        <div className="flex items-start justify-between gap-3">
          {fieldError('text', 'hand-in-text-error') || <span />}
          <span
            className={cn(
              'text-[11px] tabular-nums',
              text.length > SUBMISSION_LIMITS.textMax ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {text.length.toLocaleString('en')} / {SUBMISSION_LIMITS.textMax.toLocaleString('en')}
          </span>
        </div>
      </div>

      {isLate && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-400">
          انتهى الموعد النهائي. سيُقبل تسليمك لكنه سيظهر للمقيّم كتسليم متأخر.
        </p>
      )}

      {upload && (
        <div className="space-y-2 rounded-xl border border-dashed bg-background p-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" aria-hidden />
            <p className="flex-1 text-[11px] text-muted-foreground tabular-nums">جارٍ رفع الملفات · {upload.progress}%</p>
            <button
              type="button"
              onClick={() => upload.controller.abort()}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="إلغاء التسليم"
              title="إلغاء التسليم"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Progress value={upload.progress} label="رفع الملفات" className="h-1.5" />
        </div>
      )}

      {errors.form && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[11px] text-destructive">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-navy-900 shadow-sm hover:bg-gold/90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        تسليم الحل
      </button>

      <ConfirmDialog
        open={confirming}
        title="تسليم الحل؟"
        description="بعد التسليم لا يمكنك تعديله حتى يراجعه المقيّم. تأكد من أن كل شيء جاهز."
        confirmLabel="تسليم"
        onConfirm={send}
        onClose={() => setConfirming(false)}
      />
    </form>
  );
}

function AttemptsList({ data }: { data: MySubmissionResponse }) {
  return (
    <ol className="space-y-3">
      {data.attempts.map((attempt, index) => (
        <li key={attempt.id}>
          <details open={index === 0} className="group rounded-2xl border bg-background">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-4 [&::-webkit-details-marker]:hidden">
              <span className="text-xs font-bold text-foreground">المحاولة {attempt.attemptNumber}</span>
              <SubmissionStatusBadge status={attempt.status} />
              {attempt.isLate && <LateBadge />}
              <span className="ms-auto text-[11px] text-muted-foreground">{formatDateTime(attempt.submittedAt)}</span>
            </summary>
            <div className="space-y-4 border-t p-4">
              {attempt.status === 'GRADED' && <ScoreBar score={attempt.score} maxScore={attempt.maxScore} />}
              {attempt.feedback && (
                <div className="space-y-1.5 rounded-xl bg-muted/50 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                    <MessageSquareText className="h-3.5 w-3.5 text-gold" aria-hidden /> ملاحظات المقيّم
                  </p>
                  <p dir="auto" className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {attempt.feedback}
                  </p>
                </div>
              )}
              <SubmissionContentView
                content={attempt.content}
                textLabel={attempt.content.type === 'TEXT_CONTENT' ? 'الإجابة' : 'الملاحظة'}
              />
            </div>
          </details>
        </li>
      ))}
    </ol>
  );
}

/** The hand-in form (when the student may submit) and their earlier attempts. */
export function HandInPanel({ assignmentId }: { assignmentId: string }) {
  const { data, isPending, isError, refetch } = useMySubmission(assignmentId);

  if (isPending) return <Skeleton className="h-64 rounded-3xl" role="status" aria-label="جارٍ تحميل التسليم" />;

  if (isError) {
    return (
      <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-sm">
        <h2 className="text-base font-bold text-foreground">تسليم الحل</h2>
        <p className="text-xs text-destructive">تعذّر تحميل حالة التسليم.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted"
        >
          إعادة المحاولة
        </button>
      </section>
    );
  }

  const block = data.submitBlockReason ? BLOCK_REASONS[data.submitBlockReason] : null;
  const revision = data.latest?.status === 'NEEDS_REVISION' ? data.latest : null;

  return (
    <>
      <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="submit-heading">
        <h2 id="submit-heading" className="text-base font-bold text-foreground">
          تسليم الحل
        </h2>

        {revision && data.canSubmit && (
          <div className="space-y-1.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> طلب المقيّم تعديلات على المحاولة {revision.attemptNumber}
            </p>
            {revision.feedback && (
              <p dir="auto" className="text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">
                {revision.feedback}
              </p>
            )}
          </div>
        )}

        {data.canSubmit ? (
          // Remounted per attempt so a fresh form follows a revision request.
          <HandInForm key={data.latest?.id ?? 'first'} data={data} />
        ) : (
          block && (
            <p className="flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <block.icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
              {block.text}
            </p>
          )
        )}
      </section>

      {data.attempts.length > 0 && (
        <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="attempts-heading">
          <h2 id="attempts-heading" className="text-base font-bold text-foreground">
            تسليماتي <span className="text-xs font-normal text-muted-foreground tabular-nums">({data.attempts.length})</span>
          </h2>
          <AttemptsList data={data} />
        </section>
      )}
    </>
  );
}
