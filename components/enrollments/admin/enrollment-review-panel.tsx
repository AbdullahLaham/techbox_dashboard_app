// components/enrollments/admin/enrollment-review-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, X } from 'lucide-react';
import { useAdminEnrollment, useChangeEnrollmentStatus } from '@/hooks/use-enrollments';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/assignment-format';
import { EnrollmentStatusBadge } from './enrollment-status-badge';
import { ENROLLMENT_STATUS_TRANSITIONS, type EnrollmentStatus } from '@/types/api.contract';

/** Button text and style for each target status. */
const ACTIONS: Record<EnrollmentStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'قبول الطلب / تفعيل', className: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  REJECTED: { label: 'رفض الطلب', className: 'bg-destructive/10 text-destructive hover:bg-destructive/20' },
  PENDING: { label: 'إعادة إلى المراجعة', className: 'border hover:bg-muted' },
  COMPLETED: { label: 'إتمام البرنامج', className: 'bg-navy-900 text-white hover:bg-navy-900/90 dark:bg-gold dark:text-navy-900' },
  SUSPENDED: { label: 'إيقاف مؤقت', className: 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25' },
  DROPPED: { label: 'إلغاء التسجيل', className: 'bg-destructive/10 text-destructive hover:bg-destructive/20' },
};

interface EnrollmentReviewPanelProps {
  enrollmentId: string | null;
  onClose: () => void;
}

export function EnrollmentReviewPanel({ enrollmentId, onClose }: EnrollmentReviewPanelProps) {
  if (!enrollmentId) return null;
  return <Panel key={enrollmentId} enrollmentId={enrollmentId} onClose={onClose} />;
}

function Panel({ enrollmentId, onClose }: { enrollmentId: string; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useAdminEnrollment(enrollmentId);
  const change = useChangeEnrollmentStatus();
  const [note, setNote] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !change.isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [change.isPending, onClose]);

  const apply = (status: EnrollmentStatus) =>
    change.mutate({ id: enrollmentId, body: { status, note: note.trim() || null } }, { onSuccess: () => setNote('') });

  const isImage = data?.receiptMimeType?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/40 backdrop-blur-sm" onClick={() => !change.isPending && onClose()}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="مراجعة الطلب"
        className="h-full w-full max-w-md space-y-5 overflow-y-auto border-l bg-card p-6 text-right shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">مراجعة طلب التسجيل</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isPending ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : isError ? (
          <div className="space-y-3 text-sm text-destructive">
            تعذّر تحميل الطلب.{' '}
            <button onClick={() => refetch()} className="underline">
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <EnrollmentStatusBadge status={data.status} />
                <span className="text-xs text-muted-foreground">قُدّم في {formatDateTime(data.createdAt)}</span>
              </div>
              <p className="text-sm font-bold text-foreground">{data.program.title}</p>
              {data.program.maxSeats !== null && <p className="text-xs text-muted-foreground">سعة الدفعة: {data.program.maxSeats} مقعداً</p>}
            </div>

            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 rounded-2xl border bg-muted/20 p-4 text-xs">
              <Field label="الاسم بالعربية" value={data.user.fullNameAr} />
              <Field label="الاسم بالإنجليزية" value={data.user.fullNameEn} ltr />
              <Field label="البريد" value={data.user.email} ltr />
              <Field label="الواتساب" value={data.user.phoneWhatsApp} ltr />
              <Field label="رقم الهوية" value={data.user.nationalId} ltr />
              <Field label="العمر" value={data.user.age === null ? null : String(data.user.age)} />
              <Field label="المحافظة" value={data.user.governorate} />
            </dl>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground">إيصال الدفع</h3>
              {data.receiptUrl ? (
                <>
                  {isImage && (
                    // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL from the API
                    <img src={data.receiptUrl} alt="إيصال الدفع" className="max-h-80 w-full rounded-xl border object-contain" />
                  )}
                  <a
                    href={data.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> فتح الإيصال في نافذة جديدة
                  </a>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{data.hasReceipt ? 'الإيصال غير متاح للعرض.' : 'لم يُرفق المتقدم إيصالاً.'}</p>
              )}
            </div>

            {data.reviewNote && (
              <div className="rounded-xl border bg-muted/30 p-3 text-xs">
                <span className="font-bold">آخر ملاحظة:</span> {data.reviewNote}
                {data.reviewedAt && <span className="text-muted-foreground"> ({formatDateTime(data.reviewedAt)})</span>}
              </div>
            )}

            {ENROLLMENT_STATUS_TRANSITIONS[data.status].length > 0 && (
              <div className="space-y-3 border-t pt-4">
                <label className="block space-y-1 text-xs font-medium">
                  ملاحظة للطالب (اختيارية)
                  <textarea
                    rows={3}
                    maxLength={1000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="مثال: الإيصال غير واضح، يرجى إعادة الرفع."
                    className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold"
                  />
                </label>

                {change.error && (
                  <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {getApiErrorMessage(change.error, 'تعذّر تحديث الحالة.')}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {ENROLLMENT_STATUS_TRANSITIONS[data.status].map((target) => (
                    <button
                      key={target}
                      disabled={change.isPending}
                      onClick={() => apply(target)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 ${ACTIONS[target].className}`}
                    >
                      {change.isPending && change.variables?.body.status === target && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {ACTIONS[target].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function Field({ label, value, ltr }: { label: string; value: string | null; ltr?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-semibold text-foreground" dir={ltr ? 'ltr' : undefined} style={ltr ? { textAlign: 'right' } : undefined}>
        {value || '—'}
      </dd>
    </>
  );
}
