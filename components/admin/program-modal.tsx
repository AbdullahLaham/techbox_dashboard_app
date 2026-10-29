// components/admin/program-modal.tsx
'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ProgramStatus, ProgramType, type Program } from '@/types/program';
import {
  PROGRAM_LIMITS,
  PROGRAM_STATUSES,
  PROGRAM_STATUS_LABELS_AR,
  PROGRAM_TYPES,
  slugify,
  type CreateProgramBody,
} from '@/types/api.contract';
import { PROGRAM_TYPE_LABELS } from '@/lib/labels';

export interface ProgramFormData {
  title: string;
  slug: string;
  description: string;
  type: ProgramType;
  status: ProgramStatus;
  coverImage: string;
  /** "" = unlimited */
  maxSeats: string;
  /** yyyy-mm-dd or "" */
  startDate: string;
  endDate: string;
  isEnrollmentOpen: boolean;
}

/** ISO date-time -> yyyy-mm-dd in the admin's timezone, for <input type="date">. */
function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** yyyy-mm-dd -> ISO at local midnight, or null. */
function fromDateInput(value: string): string | null {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export function emptyProgramForm(): ProgramFormData {
  return {
    title: '',
    slug: '',
    description: '',
    type: ProgramType.BOOTCAMP,
    status: ProgramStatus.DRAFT,
    coverImage: '',
    maxSeats: '30',
    startDate: '',
    endDate: '',
    isEnrollmentOpen: true,
  };
}

export function programToForm(program: Program): ProgramFormData {
  return {
    title: program.title,
    slug: program.slug,
    description: program.description ?? '',
    type: program.type,
    status: program.status,
    coverImage: program.coverImage ?? '',
    maxSeats: program.maxSeats === null ? '' : String(program.maxSeats),
    startDate: toDateInput(program.startDate),
    endDate: toDateInput(program.endDate),
    isEnrollmentOpen: program.isEnrollmentOpen,
  };
}

/** Form values -> request body ("" fields become null so they can be cleared). */
export function formToBody(form: ProgramFormData): CreateProgramBody {
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || null,
    type: form.type,
    status: form.status,
    coverImage: form.coverImage.trim() || null,
    maxSeats: form.maxSeats.trim() === '' ? null : Number(form.maxSeats),
    startDate: fromDateInput(form.startDate),
    endDate: fromDateInput(form.endDate),
    isEnrollmentOpen: form.isEnrollmentOpen,
  };
}

interface ProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (body: CreateProgramBody) => void;
  /** The program being edited, or null to create one. */
  program: Program | null;
  isPending: boolean;
  /** Server error to show above the buttons. */
  error?: string | null;
  /** Server validation errors by field name. */
  fieldErrors?: Record<string, string>;
}

const inputClass = 'w-full rounded-xl border bg-background px-4 py-2 text-xs focus:ring-2 focus:ring-gold outline-none';

export function ProgramModal(props: ProgramModalProps) {
  if (!props.isOpen) return null;
  // Remount per opened program so the form starts from its values without an effect.
  return <ProgramForm key={props.program?.id ?? 'new'} {...props} />;
}

function ProgramForm({ onClose, onSubmit, program, isPending, error, fieldErrors = {} }: ProgramModalProps) {
  const isEditing = !!program;
  const [form, setForm] = useState<ProgramFormData>(() => (program ? programToForm(program) : emptyProgramForm()));
  // The slug follows the title until the admin edits it by hand (or when editing an existing program).
  const [slugTouched, setSlugTouched] = useState(isEditing);

  const set = <K extends keyof ProgramFormData>(field: K, value: ProgramFormData[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const fieldError = (name: string) =>
    fieldErrors[name] ? <p className="text-[11px] text-destructive">{fieldErrors[name]}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto text-right">
        <button onClick={onClose} aria-label="إغلاق" className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold">{isEditing ? 'تعديل البرنامج' : 'إنشاء برنامج جديد'}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formToBody(form));
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium">عنوان البرنامج</label>
            <input
              type="text"
              required
              minLength={PROGRAM_LIMITS.titleMin}
              maxLength={PROGRAM_LIMITS.titleMax}
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!slugTouched) set('slug', slugify(e.target.value));
              }}
              className={inputClass}
              placeholder="مثال: معسكر تطوير تطبيقات الجوال"
            />
            {fieldError('title')}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">الرابط التعريفي (Slug)</label>
            <input
              type="text"
              required
              maxLength={PROGRAM_LIMITS.slugMax}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value);
              }}
              onBlur={() => set('slug', slugify(form.slug))}
              className={`${inputClass} font-mono text-left`}
              dir="ltr"
            />
            <p className="text-[11px] text-muted-foreground">حروف صغيرة وأرقام وشرطات فقط، ويُستخدم في رابط البرنامج.</p>
            {fieldError('slug')}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">نوع البرنامج</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as ProgramType)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs"
              >
                {PROGRAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PROGRAM_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">حالة البرنامج</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as ProgramStatus)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-xs"
              >
                {PROGRAM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROGRAM_STATUS_LABELS_AR[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">عدد المقاعد</label>
              <input
                type="number"
                min={1}
                step={1}
                placeholder="غير محدود"
                value={form.maxSeats}
                onChange={(e) => set('maxSeats', e.target.value)}
                className={inputClass}
              />
              {fieldError('maxSeats')}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">تاريخ البدء</label>
              <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
              {fieldError('startDate')}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">تاريخ الانتهاء</label>
              <input
                type="date"
                min={form.startDate || undefined}
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                className={inputClass}
              />
              {fieldError('endDate')}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={form.isEnrollmentOpen}
              onChange={(e) => set('isEnrollmentOpen', e.target.checked)}
              className="h-4 w-4 accent-gold"
            />
            التسجيل مفتوح لاستقبال طلبات جديدة
          </label>

          <div className="space-y-1">
            <label className="text-xs font-medium">رابط صورة الغلاف (Cover Image URL)</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={form.coverImage}
              onChange={(e) => set('coverImage', e.target.value)}
              className={`${inputClass} text-left`}
              dir="ltr"
            />
            {fieldError('coverImage')}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">وصف البرنامج</label>
            <textarea
              rows={3}
              maxLength={PROGRAM_LIMITS.descriptionMax}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2 text-xs resize-none"
              placeholder="اكتب نبذة مختصرة عن محتوى وأهداف البرنامج..."
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted">إلغاء</button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-gold text-navy-900 px-5 py-2 text-xs font-bold hover:bg-gold/90 disabled:opacity-50 shadow-md"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEditing ? 'حفظ التعديلات' : 'إنشاء البرنامج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
