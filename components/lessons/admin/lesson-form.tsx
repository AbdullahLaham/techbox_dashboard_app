// components/lessons/admin/lesson-form.tsx
'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { useUpdateLesson } from '@/hooks/use-admin-nodes';
import { getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { externalIdFromUrl, isHttpUrl } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import { NODE_LIMITS, type AdminNodeDetail, type UpdateNodeBody } from '@/types/nodes.contract';

type Values = {
  title: string;
  description: string;
  isMandatory: boolean;
  playbackUrl: string;
  minutes: string;
  seconds: string;
  externalId: string;
};

type FieldErrors = Partial<Record<'title' | 'description' | 'playbackUrl' | 'duration' | 'externalId', string>>;

function valuesFrom(node: AdminNodeDetail): Values {
  const duration = node.video?.durationSec ?? 0;
  return {
    title: node.title,
    description: node.description ?? '',
    isMandatory: node.isMandatory,
    playbackUrl: node.video?.playbackUrl ?? '',
    minutes: String(Math.floor(duration / 60)),
    seconds: String(duration % 60),
    externalId: node.video?.externalId ?? '',
  };
}

function toDurationSec(v: Values): number | null {
  const m = Number(v.minutes || 0);
  const s = Number(v.seconds || 0);
  if (!Number.isInteger(m) || !Number.isInteger(s) || m < 0 || s < 0 || s > 59) return null;
  return m * 60 + s;
}

function validate(v: Values, isVideo: boolean): FieldErrors {
  const errors: FieldErrors = {};
  const title = v.title.trim();
  if (!title) errors.title = 'العنوان مطلوب.';
  else if (title.length > NODE_LIMITS.titleMax) errors.title = `العنوان أطول من ${NODE_LIMITS.titleMax} حرف.`;
  if (v.description.trim().length > NODE_LIMITS.descriptionMax) errors.description = `الوصف أطول من ${NODE_LIMITS.descriptionMax} حرف.`;
  if (isVideo) {
    const url = v.playbackUrl.trim();
    if (!url) errors.playbackUrl = 'رابط الفيديو مطلوب.';
    else if (!isHttpUrl(url) || url.length > NODE_LIMITS.urlMax) errors.playbackUrl = 'أدخل رابطاً صالحاً يبدأ بـ https://';
    if (toDurationSec(v) === null) errors.duration = 'أدخل مدة صحيحة (الثواني من 0 إلى 59).';
  }
  return errors;
}

/** Only the changed fields: the rest of the lesson stays as the server has it. */
function buildUpdate(original: Values, v: Values, isVideo: boolean): UpdateNodeBody {
  const body: UpdateNodeBody = {};
  if (v.title.trim() !== original.title.trim()) body.title = v.title.trim();
  if (v.description.trim() !== original.description.trim()) body.description = v.description.trim() || null;
  if (v.isMandatory !== original.isMandatory) body.isMandatory = v.isMandatory;

  if (isVideo) {
    const video: NonNullable<UpdateNodeBody['video']> = {};
    const url = v.playbackUrl.trim();
    const urlChanged = url !== original.playbackUrl.trim();
    if (urlChanged) video.playbackUrl = url;
    const duration = toDurationSec(v);
    if (duration !== null && duration !== toDurationSec(original)) video.durationSec = duration;

    const externalId = v.externalId.trim();
    if (externalId && externalId !== original.externalId.trim()) video.externalId = externalId;
    // A new video URL with the id left as is: take the id from the new URL, as the server does on create.
    else if (urlChanged) video.externalId = externalIdFromUrl(url);

    if (Object.keys(video).length > 0) body.video = video;
  }
  return body;
}

/** Server details use the API field names ("video.playbackUrl"); map them to the form fields. */
function serverFieldErrors(details: Record<string, string>): FieldErrors {
  return {
    title: details.title,
    description: details.description,
    playbackUrl: details['video.playbackUrl'] ?? details.video,
    duration: details['video.durationSec'],
    externalId: details['video.externalId'],
  };
}

const inputClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold aria-invalid:border-destructive';

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-[11px] text-destructive">
      {message}
    </p>
  );
}

export function LessonForm({ node }: { node: AdminNodeDetail }) {
  const isVideo = node.type === 'VIDEO_LECTURE';
  const [original, setOriginal] = useState(() => valuesFrom(node));
  const [values, setValues] = useState(original);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const update = useUpdateLesson(node.id);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const body = buildUpdate(original, values, isVideo);
  const dirty = Object.keys(body).length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values, isVideo);
    setErrors(found);
    if (Object.values(found).some(Boolean) || !dirty) return;

    update.mutate(body, {
      onSuccess: (fresh) => {
        const next = valuesFrom(fresh);
        setOriginal(next);
        setValues(next);
        setSaved(true);
      },
      onError: (error) => setErrors(serverFieldErrors(getApiErrorDetails(error))),
    });
  };

  const generalError = update.error ? getApiErrorMessage(update.error, 'تعذّر حفظ الدرس.') : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="lesson-form-heading">
      <h2 id="lesson-form-heading" className="text-base font-bold text-foreground">
        بيانات الدرس
      </h2>

      <div className="space-y-1">
        <label htmlFor="lesson-title" className="text-xs font-medium">
          العنوان
        </label>
        <input
          id="lesson-title"
          value={values.title}
          maxLength={NODE_LIMITS.titleMax}
          onChange={(e) => set('title', e.target.value)}
          aria-invalid={!!errors.title}
          aria-describedby="lesson-title-error"
          className={inputClass}
        />
        <FieldError id="lesson-title-error" message={errors.title} />
      </div>

      <div className="space-y-1">
        <label htmlFor="lesson-description" className="text-xs font-medium">
          الوصف (اختياري)
        </label>
        <textarea
          id="lesson-description"
          rows={3}
          value={values.description}
          maxLength={NODE_LIMITS.descriptionMax}
          onChange={(e) => set('description', e.target.value)}
          aria-invalid={!!errors.description}
          aria-describedby="lesson-description-error"
          className={cn(inputClass, 'resize-y')}
        />
        <FieldError id="lesson-description-error" message={errors.description} />
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={values.isMandatory}
          onChange={(e) => set('isMandatory', e.target.checked)}
          className="h-4 w-4 accent-gold"
        />
        درس إلزامي لإتمام البرنامج
      </label>

      {isVideo && (
        <fieldset className="space-y-4 rounded-2xl border bg-muted/30 p-4">
          <legend className="px-1 text-xs font-bold text-foreground">الفيديو</legend>
          <div className="space-y-1">
            <label htmlFor="lesson-video-url" className="text-xs font-medium">
              رابط التشغيل (Bunny embed)
            </label>
            <input
              id="lesson-video-url"
              type="url"
              dir="ltr"
              placeholder="https://iframe.mediadelivery.net/embed/..."
              value={values.playbackUrl}
              onChange={(e) => set('playbackUrl', e.target.value)}
              aria-invalid={!!errors.playbackUrl}
              aria-describedby="lesson-video-url-error"
              className={cn(inputClass, 'text-left')}
            />
            <FieldError id="lesson-video-url-error" message={errors.playbackUrl} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span id="lesson-duration-label" className="text-xs font-medium">
                المدة
              </span>
              <div className="flex items-center gap-2" role="group" aria-labelledby="lesson-duration-label">
                <input
                  type="number"
                  min={0}
                  step={1}
                  aria-label="الدقائق"
                  value={values.minutes}
                  onChange={(e) => set('minutes', e.target.value)}
                  aria-invalid={!!errors.duration}
                  className={cn(inputClass, 'tabular-nums')}
                />
                <span className="text-[11px] text-muted-foreground">دقيقة</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  aria-label="الثواني"
                  value={values.seconds}
                  onChange={(e) => set('seconds', e.target.value)}
                  aria-invalid={!!errors.duration}
                  className={cn(inputClass, 'tabular-nums')}
                />
                <span className="text-[11px] text-muted-foreground">ثانية</span>
              </div>
              <FieldError id="lesson-duration-error" message={errors.duration} />
            </div>
            <div className="space-y-1">
              <label htmlFor="lesson-video-id" className="text-xs font-medium">
                معرّف الفيديو (اختياري)
              </label>
              <input
                id="lesson-video-id"
                dir="ltr"
                value={values.externalId}
                onChange={(e) => set('externalId', e.target.value)}
                aria-invalid={!!errors.externalId}
                aria-describedby="lesson-video-id-error"
                className={cn(inputClass, 'text-left')}
              />
              <p className="text-[11px] text-muted-foreground">يُستخرج تلقائياً من آخر جزء في الرابط.</p>
              <FieldError id="lesson-video-id-error" message={errors.externalId} />
            </div>
          </div>
        </fieldset>
      )}

      {generalError && (
        <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {generalError}
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
          حفظ التغييرات
        </button>
      </div>
    </form>
  );
}
