// components/admin/curriculum-modal.tsx
'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { NodeType, type ActivityNode, type CreateModuleDto, type CreateNodeDto, type CreateTrackDto } from '@/types/program';
import { NODE_TYPES, NODE_TYPE_LABELS_AR, PROGRAM_LIMITS, type SubmissionType } from '@/types/api.contract';
import { SUBMISSION_TYPE_LABELS } from '@/lib/labels';
import { fromLocalInputValue, localTimeZone, toLocalInputValue } from '@/lib/assignment-format';
import { externalIdFromUrl } from '@/lib/lessons';

export type CurriculumEntity = 'TRACK' | 'MODULE' | 'NODE';
export type CurriculumMode = 'CREATE' | 'EDIT';

/** Tracks, modules and lessons all satisfy this shape, so any of them can prefill the form. */
export type CurriculumInitialData = Partial<
  Pick<ActivityNode, 'title' | 'description' | 'type' | 'isMandatory' | 'video' | 'assignment'>
>;

export type CurriculumSubmitPayload =
  | { kind: 'TRACK'; dto: CreateTrackDto }
  | { kind: 'MODULE'; dto: CreateModuleDto }
  /** `link`: optional reading-material URL, sent with new READING_MATERIAL lessons. */
  | { kind: 'NODE'; dto: CreateNodeDto; link?: string };

interface CurriculumModalProps {
  isOpen: boolean;
  type: CurriculumEntity | null;
  mode: CurriculumMode;
  initialData?: CurriculumInitialData;
  onClose: () => void;
  onSubmit: (payload: CurriculumSubmitPayload) => void;
  isPending: boolean;
  /** Server error to show above the buttons. */
  error?: string | null;
}

const inputClass = 'w-full rounded-xl border bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-gold';
const SUBMISSION_TYPES = Object.keys(SUBMISSION_TYPE_LABELS) as SubmissionType[];

export function CurriculumModal({ isOpen, type, ...formProps }: CurriculumModalProps) {
  if (!isOpen || !type) return null;
  // The form initialises its state from `initialData` once per mount; a new key per opened
  // item remounts it, so no effect is needed to reset fields between openings.
  return <CurriculumForm key={`${type}-${formProps.mode}-${JSON.stringify(formProps.initialData ?? null)}`} type={type} {...formProps} />;
}

function CurriculumForm({
  type,
  mode,
  initialData,
  onClose,
  onSubmit,
  isPending,
  error,
}: Omit<CurriculumModalProps, 'isOpen' | 'type'> & { type: CurriculumEntity }) {
  const editing = mode === 'EDIT' ? initialData : undefined;

  const [title, setTitle] = useState(editing?.title ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');

  // Lesson fields
  const [nodeType, setNodeType] = useState<NodeType>(editing?.type ?? NodeType.VIDEO_LECTURE);
  const [isMandatory, setIsMandatory] = useState(editing?.isMandatory ?? true);
  const [playbackUrl, setPlaybackUrl] = useState(editing?.video?.playbackUrl ?? '');
  const [durationMin, setDurationMin] = useState(String(Math.round((editing?.video?.durationSec ?? 600) / 60)));
  const [instructions, setInstructions] = useState(editing?.assignment?.instructions ?? '');
  const [allowedType, setAllowedType] = useState<SubmissionType>(editing?.assignment?.allowedType ?? 'URL_LINK');
  const [maxScore, setMaxScore] = useState(String(editing?.assignment?.maxScore ?? 100));
  const initialDue = toLocalInputValue(editing?.assignment?.dueDate ?? null);
  const [dueDate, setDueDate] = useState(initialDue);
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = { title: title.trim(), description: description.trim() || null };
    // New items take the last position (the server decides); edits keep theirs.
    if (type !== 'NODE') {
      onSubmit({ kind: type, dto: base });
      return;
    }

    const dto: CreateNodeDto = { ...base, type: nodeType, isMandatory };
    if (nodeType === NodeType.VIDEO_LECTURE && playbackUrl.trim()) {
      const url = playbackUrl.trim();
      dto.videoData = {
        playbackUrl: url,
        durationSec: Math.max(0, Math.round(Number(durationMin) * 60) || 0),
        // Keep the stored id unless the video URL changed.
        externalId: editing?.video && editing.video.playbackUrl === url ? editing.video.externalId : externalIdFromUrl(url),
      };
    }
    if (nodeType === NodeType.ASSIGNMENT) {
      dto.assignmentData = {
        instructions: instructions.trim(),
        allowedType,
        maxScore: Number(maxScore),
        // Sent only when changed: an assignment whose deadline passed can still be edited.
        ...(dueDate !== initialDue ? { dueDate: fromLocalInputValue(dueDate) } : {}),
      };
    }
    onSubmit({ kind: 'NODE', dto, link: nodeType === NodeType.READING_MATERIAL ? link.trim() || undefined : undefined });
  };

  const titlesMap = {
    TRACK: mode === 'CREATE' ? 'إضافة مسار تعليمي جديد' : 'تعديل المسار التعليمي',
    MODULE: mode === 'CREATE' ? 'إضافة وحدة تعليمية جديدة' : 'تعديل الوحدة التعليمية',
    NODE: mode === 'CREATE' ? 'إضافة درس أو مهمة جديدة' : 'تعديل الدرس أو المهمة',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
      <div className="relative w-full max-w-lg rounded-3xl border bg-card p-6 shadow-2xl space-y-6 text-right max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} aria-label="إغلاق" className="absolute left-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted">
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-bold text-foreground">{titlesMap[type]}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium">العنوان</label>
            <input
              type="text"
              required
              maxLength={PROGRAM_LIMITS.curriculumTitleMax}
              placeholder="اكتب العنوان هنا..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`${inputClass} px-4`}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">الوصف (اختياري)</label>
            <textarea
              rows={2}
              maxLength={PROGRAM_LIMITS.curriculumDescriptionMax}
              placeholder="نبذة مختصرة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} px-4 resize-none`}
            />
          </div>

          {type === 'NODE' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">نوع العنصر</label>
                  <select
                    value={nodeType}
                    disabled={mode === 'EDIT'}
                    title={mode === 'EDIT' ? 'لا يمكن تغيير نوع الدرس بعد إنشائه' : undefined}
                    onChange={(e) => setNodeType(e.target.value as NodeType)}
                    className={inputClass}
                  >
                    {NODE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {NODE_TYPE_LABELS_AR[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">الأهمية</label>
                  <select value={isMandatory ? 'true' : 'false'} onChange={(e) => setIsMandatory(e.target.value === 'true')} className={inputClass}>
                    <option value="true">إلزامي للإتمام</option>
                    <option value="false">اختياري</option>
                  </select>
                </div>
              </div>

              {nodeType === NodeType.VIDEO_LECTURE && (
                <div className="space-y-3 rounded-2xl bg-muted/30 p-4 border">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">رابط بث الفيديو (Playback URL)</label>
                    <input
                      type="url"
                      required
                      placeholder="https://iframe.mediadelivery.net/embed/..."
                      value={playbackUrl}
                      onChange={(e) => setPlaybackUrl(e.target.value)}
                      className={`${inputClass} text-left`}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">المدة (بالدقائق)</label>
                    <input type="number" min={0} step={1} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} className={inputClass} />
                  </div>
                </div>
              )}

              {nodeType === NodeType.READING_MATERIAL && mode === 'CREATE' && (
                <div className="space-y-3 rounded-2xl bg-muted/30 p-4 border">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">رابط المادة (اختياري)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className={`${inputClass} text-left`}
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">أو اتركه فارغاً وارفع ملفاً (PDF، Word، ...) من صفحة الدرس بعد الحفظ.</p>
                </div>
              )}

              {nodeType === NodeType.QUIZ && mode === 'CREATE' && (
                <p className="rounded-2xl border bg-muted/30 p-4 text-[11px] text-muted-foreground">
                  يُنشأ الاختبار غير منشور ولا يراه الطلاب. بعد الحفظ ستنتقل إلى محرر الاختبار لإضافة الأسئلة ثم نشره.
                </p>
              )}

              {nodeType === NodeType.ASSIGNMENT && (
                <div className="space-y-3 rounded-2xl bg-muted/30 p-4 border">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">تعليمات المهمة للطلاب</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="اشرح المطلوب من الطالب إنجازه..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">نوع التسليم</label>
                      <select value={allowedType} onChange={(e) => setAllowedType(e.target.value as SubmissionType)} className={inputClass}>
                        {SUBMISSION_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {SUBMISSION_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">الدرجة العظمى</label>
                      <input
                        type="number"
                        min={0.01}
                        max={999.99}
                        step={0.01}
                        required
                        value={maxScore}
                        onChange={(e) => setMaxScore(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">الموعد النهائي (اختياري، بتوقيت {localTimeZone()})</label>
                    <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
                  </div>
                  {mode === 'CREATE' && (
                    <p className="text-[11px] text-muted-foreground">
                      يُنشأ الواجب كمسودة لا يراها الطلاب. انشره وأرفق ملفات التعليمات من صفحة «إدارة الواجبات».
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-gold text-navy-900 px-5 py-2 text-xs font-bold shadow-md hover:bg-gold/90 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === 'CREATE' ? 'حفظ وإضافة' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
