// components/programs/enrollment-apply-dialog.tsx
'use client';

import { useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { useApplyToProgram } from '@/hooks/use-enrollments';
import { getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { formatFileSize } from '@/lib/assignment-format';
import { ENROLLMENT_RECEIPT_LIMITS, type EnrollmentApplicationFields } from '@/types/api.contract';

/** Same list as the mobile app (src/types/enrollment.ts). */
const GOVERNORATES = [
  'غزة',
  'شمال غزة',
  'دير البلح',
  'خان يونس',
  'رفح',
  'القدس',
  'رام الله والبيرة',
  'خليل الرحمن',
  'نابلس',
  'جنين',
  'بيت لحم',
  'طولكرم',
  'قلقيلية',
  'أريحا',
  'سلفيت',
  'طوباس',
];

const RECEIPT_ACCEPT = Object.keys(ENROLLMENT_RECEIPT_LIMITS.allowedTypes).join(',');
const inputClass = 'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold';

interface EnrollmentApplyDialogProps {
  open: boolean;
  programId: string;
  programTitle: string;
  onClose: () => void;
}

export function EnrollmentApplyDialog(props: EnrollmentApplyDialogProps) {
  if (!props.open) return null;
  return <ApplyForm {...props} />;
}

function ApplyForm({ programId, programTitle, onClose }: EnrollmentApplyDialogProps) {
  const apply = useApplyToProgram();
  const [fields, setFields] = useState({
    fullNameAr: '',
    fullNameEn: '',
    age: '',
    phoneWhatsApp: '',
    nationalId: '',
    governorate: GOVERNORATES[0],
  });
  const [receipt, setReceipt] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const set = (name: keyof typeof fields, value: string) => setFields((prev) => ({ ...prev, [name]: value }));
  const details = apply.error ? getApiErrorDetails(apply.error) : {};
  const fieldError = (name: string) => (details[name] ? <p className="text-[11px] text-destructive">{details[name]}</p> : null);

  const pickReceipt = (file: File | undefined) => {
    setFileError(null);
    if (!file) return setReceipt(null);
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ENROLLMENT_RECEIPT_LIMITS.allowedTypes[ext]) {
      setFileError('يُقبل الإيصال بصيغة JPG أو PNG أو WEBP أو PDF.');
      return setReceipt(null);
    }
    if (file.size > ENROLLMENT_RECEIPT_LIMITS.maxBytes) {
      setFileError(`حجم الإيصال يتجاوز ${formatFileSize(ENROLLMENT_RECEIPT_LIMITS.maxBytes)}.`);
      return setReceipt(null);
    }
    setReceipt(file);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: EnrollmentApplicationFields = { ...fields, age: Number(fields.age) };
    apply.mutate({ programId, fields: body, receipt }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir="rtl">
      <div className="relative max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-3xl border bg-card p-6 text-right shadow-2xl">
        <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute top-4 left-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">طلب الانضمام</h2>
          <p className="text-xs text-muted-foreground">{programTitle}، يراجع فريق الحاضنة طلبك وإيصال الدفع ثم يفعّل وصولك للمحتوى.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">الاسم الثلاثي بالعربية</label>
              <input required value={fields.fullNameAr} onChange={(e) => set('fullNameAr', e.target.value)} className={inputClass} />
              {fieldError('fullNameAr')}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">الاسم الكامل بالإنجليزية</label>
              <input
                required
                dir="ltr"
                value={fields.fullNameEn}
                onChange={(e) => set('fullNameEn', e.target.value)}
                className={`${inputClass} text-left`}
              />
              {fieldError('fullNameEn')}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">العمر</label>
              <input required type="number" min={10} max={100} value={fields.age} onChange={(e) => set('age', e.target.value)} className={inputClass} />
              {fieldError('age')}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">رقم الواتساب</label>
              <input
                required
                type="tel"
                dir="ltr"
                placeholder="+970..."
                value={fields.phoneWhatsApp}
                onChange={(e) => set('phoneWhatsApp', e.target.value)}
                className={`${inputClass} text-left`}
              />
              {fieldError('phoneWhatsApp')}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">رقم الهوية</label>
              <input required dir="ltr" value={fields.nationalId} onChange={(e) => set('nationalId', e.target.value)} className={`${inputClass} text-left`} />
              {fieldError('nationalId')}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">المحافظة</label>
              <select value={fields.governorate} onChange={(e) => set('governorate', e.target.value)} className={inputClass}>
                {GOVERNORATES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">إيصال التحويل (اختياري، حتى {formatFileSize(ENROLLMENT_RECEIPT_LIMITS.maxBytes)})</label>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed bg-background px-3 py-3 text-xs text-muted-foreground hover:bg-muted/40">
              <Upload className="h-4 w-4 text-gold" />
              <span className="truncate">{receipt ? `${receipt.name} (${formatFileSize(receipt.size)})` : 'اختر صورة أو ملف PDF'}</span>
              <input type="file" accept={RECEIPT_ACCEPT} className="sr-only" onChange={(e) => pickReceipt(e.target.files?.[0])} />
            </label>
            {fileError && <p className="text-[11px] text-destructive">{fileError}</p>}
          </div>

          {apply.error && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {getApiErrorMessage(apply.error, 'تعذّر إرسال الطلب.')}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={apply.isPending}
              className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90 disabled:opacity-50"
            >
              {apply.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              إرسال الطلب
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
