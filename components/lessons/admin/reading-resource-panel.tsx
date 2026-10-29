// components/lessons/admin/reading-resource-panel.tsx
'use client';

import { useRef, useState } from 'react';
import { isCancel } from 'axios';
import { BookOpen, ExternalLink, FileText, Link2, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Progress } from '@/components/ui/progress';
import { useDeleteLessonResource, useUpdateLesson, useUploadLessonFile } from '@/hooks/use-admin-nodes';
import { getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { formatFileSize } from '@/lib/assignment-format';
import { isHttpUrl } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import { NODE_FILE_ACCEPT, validateNodeFile } from '@/services/nodes-admin-service';
import { NODE_FILE_LIMITS, NODE_LIMITS, type AdminNodeDetail } from '@/types/nodes.contract';

type Mode = 'LINK' | 'FILE';

interface Upload {
  name: string;
  size: number;
  progress: number;
  controller: AbortController;
}

export function ReadingResourcePanel({ node }: { node: AdminNodeDetail }) {
  const resource = node.resource;
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(resource?.kind ?? 'LINK');
  const [link, setLink] = useState(resource?.kind === 'LINK' ? resource.url : '');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const updateLesson = useUpdateLesson(node.id);
  const uploadFile = useUploadLessonFile(node.id);
  const removeResource = useDeleteLessonResource(node.id);

  const saveLink = (e: React.FormEvent) => {
    e.preventDefault();
    const url = link.trim();
    if (!isHttpUrl(url) || url.length > NODE_LIMITS.urlMax) {
      setLinkError('أدخل رابطاً صالحاً يبدأ بـ https://');
      return;
    }
    setLinkError(null);
    updateLesson.mutate(
      { link: url },
      {
        onError: (error) =>
          setLinkError(getApiErrorDetails(error).link ?? getApiErrorMessage(error, 'تعذّر حفظ الرابط.')),
      },
    );
  };

  const startUpload = (file: File | undefined) => {
    if (!file || upload) return;
    const problem = validateNodeFile(file);
    if (problem) {
      setUploadError(`${file.name}: ${problem}`);
      return;
    }
    setUploadError(null);
    const controller = new AbortController();
    setUpload({ name: file.name, size: file.size, progress: 0, controller });
    uploadFile.mutate(
      {
        file,
        signal: controller.signal,
        onProgress: (progress) => setUpload((prev) => (prev ? { ...prev, progress } : prev)),
      },
      {
        onSuccess: () => setLink(''),
        onError: (error) => {
          if (!isCancel(error)) setUploadError(getApiErrorMessage(error, 'تعذّر رفع الملف.'));
        },
        onSettled: () => setUpload(null),
      },
    );
  };

  const savedLink = resource?.kind === 'LINK' ? resource.url : '';

  return (
    <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="resource-heading">
      <h2 id="resource-heading" className="flex items-center gap-2 text-base font-bold text-foreground">
        <BookOpen className="h-4 w-4 text-gold" aria-hidden /> المادة القرائية
      </h2>

      {resource ? (
        <div className="flex items-center gap-3 rounded-xl border bg-background p-3">
          {resource.kind === 'FILE' ? (
            <FileText className="h-5 w-5 shrink-0 text-gold" aria-hidden />
          ) : (
            <Link2 className="h-5 w-5 shrink-0 text-gold" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground" dir={resource.kind === 'LINK' ? 'ltr' : undefined}>
              <bdi>{resource.kind === 'FILE' ? resource.fileName : resource.url}</bdi>
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {resource.kind === 'FILE'
                ? `ملف${resource.sizeBytes != null ? ` · ${formatFileSize(resource.sizeBytes)}` : ''}`
                : 'رابط خارجي'}
            </p>
          </div>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="فتح"
            aria-label="فتح المادة"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => {
              removeResource.reset();
              setConfirmRemove(true);
            }}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="إزالة"
            aria-label="إزالة المادة"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-700 dark:text-amber-400">
          لا يوجد محتوى بعد. أضف رابطاً أو ارفع ملفاً ليجد الطلاب ما يقرؤونه.
        </p>
      )}

      <div role="tablist" aria-label="نوع المادة" className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/40 p-1">
        {(
          [
            ['LINK', 'رابط', Link2],
            ['FILE', 'ملف', UploadCloud],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors',
              mode === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {mode === 'LINK' ? (
        <form onSubmit={saveLink} noValidate className="space-y-2">
          <label htmlFor="reading-link" className="text-xs font-medium">
            رابط المادة
          </label>
          <input
            id="reading-link"
            type="url"
            dir="ltr"
            placeholder="https://..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            aria-invalid={!!linkError}
            aria-describedby="reading-link-error"
            className="w-full rounded-xl border bg-background px-3 py-2 text-left text-xs outline-none focus:ring-2 focus:ring-gold aria-invalid:border-destructive"
          />
          {linkError && (
            <p id="reading-link-error" className="text-[11px] text-destructive">
              {linkError}
            </p>
          )}
          {resource?.kind === 'FILE' && (
            <p className="text-[11px] text-muted-foreground">حفظ رابط يحذف الملف المرفوع حالياً.</p>
          )}
          <button
            type="submit"
            disabled={updateLesson.isPending || !link.trim() || link.trim() === savedLink}
            className="flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy-900 hover:bg-gold/90 disabled:opacity-50"
          >
            {updateLesson.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            حفظ الرابط
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {upload ? (
            <div className="space-y-2 rounded-xl border border-dashed bg-background p-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    <bdi>{upload.name}</bdi>
                  </p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {formatFileSize(upload.size)} · {upload.progress}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => upload.controller.abort()}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="إلغاء الرفع"
                  title="إلغاء الرفع"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Progress value={upload.progress} label={`رفع ${upload.name}`} className="h-1.5" />
            </div>
          ) : (
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
                startUpload(e.dataTransfer.files[0]);
              }}
              className={cn(
                'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold',
                dragging ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 hover:bg-muted/30',
              )}
            >
              <UploadCloud className="h-7 w-7 text-gold" aria-hidden />
              <p className="text-xs font-semibold text-foreground">اسحب الملف هنا أو انقر للاختيار</p>
              <p className="text-[11px] text-muted-foreground">
                PDF, Word, PowerPoint, Excel, صور, TXT, ZIP · حتى {NODE_FILE_LIMITS.maxBytes / (1024 * 1024)} ميجابايت
              </p>
              <input
                ref={inputRef}
                type="file"
                accept={NODE_FILE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  startUpload(e.target.files?.[0]);
                  e.target.value = ''; // allow picking the same file again
                }}
              />
            </div>
          )}
          {resource && !upload && <p className="text-[11px] text-muted-foreground">رفع ملف جديد يستبدل المادة الحالية ويحذفها.</p>}
          {uploadError && (
            <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[11px] text-destructive">
              <bdi>{uploadError}</bdi>
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title="إزالة المادة القرائية؟"
        description={
          resource?.kind === 'FILE'
            ? 'سيُحذف الملف نهائياً ولن يجد الطلاب محتوى في هذا الدرس حتى تضيف غيره.'
            : 'سيُزال الرابط ولن يجد الطلاب محتوى في هذا الدرس حتى تضيف غيره.'
        }
        confirmLabel="إزالة"
        tone="danger"
        pending={removeResource.isPending}
        error={removeResource.error ? getApiErrorMessage(removeResource.error, 'تعذّرت الإزالة.') : null}
        onConfirm={() =>
          removeResource.mutate(undefined, {
            onSuccess: () => {
              setConfirmRemove(false);
              setLink('');
            },
          })
        }
        onClose={() => setConfirmRemove(false)}
      />
    </section>
  );
}
