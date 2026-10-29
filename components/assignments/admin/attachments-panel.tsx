// components/assignments/admin/attachments-panel.tsx
'use client';

import { useRef, useState } from 'react';
import { isCancel } from 'axios';
import { Download, FileText, Loader2, Paperclip, Trash2, UploadCloud, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Progress } from '@/components/ui/progress';
import { useDeleteAttachment, useUploadAttachment } from '@/hooks/use-admin-assignments';
import { getAssignmentErrorMessage } from '@/lib/assignment-errors';
import { formatFileSize } from '@/lib/assignment-format';
import { cn } from '@/lib/utils';
import { ATTACHMENT_ACCEPT, validateAttachmentFile } from '@/services/assignments-admin-service';
import { ATTACHMENT_LIMITS, type AdminAttachment } from '@/types/assignments.admin.contract';

interface UploadItem {
  key: string;
  name: string;
  size: number;
  progress: number;
  error?: string;
  controller: AbortController;
}

interface AttachmentsPanelProps {
  assignmentId: string;
  attachments: readonly AdminAttachment[];
  /** Archived assignments refuse file changes (spec §6.7). */
  readOnly?: boolean;
}

export function AttachmentsPanel({ assignmentId, attachments, readOnly = false }: AttachmentsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [toDelete, setToDelete] = useState<AdminAttachment | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const upload = useUploadAttachment();
  const removeAttachment = useDeleteAttachment(assignmentId);

  const activeUploads = uploads.filter((u) => !u.error);
  const usedSlots = attachments.length + activeUploads.length;

  const patchUpload = (key: string, patch: Partial<UploadItem>) =>
    setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, ...patch } : u)));
  const dropUpload = (key: string) => setUploads((prev) => prev.filter((u) => u.key !== key));

  /** Checks each file in the browser first (the server still enforces type, size and count), then uploads. */
  const onFilesSelected = (files: File[]) => {
    if (readOnly || files.length === 0) return;
    const problems: string[] = [];
    let count = usedSlots;

    for (const file of files) {
      const problem = validateAttachmentFile(file, count);
      if (problem) {
        problems.push(`${file.name}: ${problem}`);
        continue;
      }
      count += 1;

      const item: UploadItem = {
        key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        name: file.name,
        size: file.size,
        progress: 0,
        controller: new AbortController(),
      };
      setUploads((prev) => [...prev, item]);

      // mutateAsync, not mutate: per-call callbacks of `mutate` only fire for the most recent call.
      upload
        .mutateAsync({
          assignmentId,
          file,
          signal: item.controller.signal,
          onProgress: (percent) => patchUpload(item.key, { progress: percent }),
        })
        .then(() => dropUpload(item.key))
        .catch((error: unknown) => {
          if (isCancel(error)) dropUpload(item.key);
          else patchUpload(item.key, { error: getAssignmentErrorMessage(error) });
        });
    }
    setRejections(problems);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    setDeleteError(null);
    removeAttachment.mutate(toDelete.id, {
      onSuccess: () => setToDelete(null),
      onError: (e) => setDeleteError(getAssignmentErrorMessage(e)),
    });
  };

  return (
    <section className="space-y-4 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="attachments-heading">
      <div className="flex items-center justify-between">
        <h2 id="attachments-heading" className="flex items-center gap-2 text-base font-bold text-foreground">
          <Paperclip className="h-4 w-4 text-gold" aria-hidden /> ملفات التعليمات
        </h2>
        <span
          className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums',
            usedSlots >= ATTACHMENT_LIMITS.maxCount ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground',
          )}
        >
          <bdi>
            {usedSlots} / {ATTACHMENT_LIMITS.maxCount}
          </bdi>
        </span>
      </div>

      {!readOnly && (
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
            onFilesSelected(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold',
            dragging ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50 hover:bg-muted/30',
          )}
        >
          <UploadCloud className="h-7 w-7 text-gold" aria-hidden />
          <p className="text-xs font-semibold text-foreground">اسحب الملفات هنا أو انقر للاختيار</p>
          <p className="text-[11px] text-muted-foreground">
            PDF, Word, PowerPoint, Excel, صور, TXT, ZIP · حتى {ATTACHMENT_LIMITS.maxBytes / (1024 * 1024)} ميجابايت للملف
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              onFilesSelected(Array.from(e.target.files ?? []));
              e.target.value = ''; // allow picking the same file again
            }}
          />
        </div>
      )}

      {rejections.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-[11px] text-destructive">
          {rejections.map((r) => (
            <li key={r}>
              <bdi>{r}</bdi>
            </li>
          ))}
        </ul>
      )}

      <ul className="space-y-2">
        {attachments.map((file) => (
          <li key={file.id} className="flex items-center gap-3 rounded-xl border bg-background p-3">
            <FileText className="h-5 w-5 shrink-0 text-gold" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">
                <bdi>{file.fileName}</bdi>
              </p>
              <p className="text-[11px] text-muted-foreground tabular-nums">{formatFileSize(file.sizeBytes)}</p>
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="تنزيل"
              aria-label={`تنزيل ${file.fileName}`}
            >
              <Download className="h-4 w-4" />
            </a>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setToDelete(file)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="حذف"
                aria-label={`حذف ${file.fileName}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}

        {uploads.map((u) => (
          <li key={u.key} className="space-y-2 rounded-xl border border-dashed bg-background p-3">
            <div className="flex items-center gap-3">
              {u.error ? (
                <FileText className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
              ) : (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-gold" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  <bdi>{u.name}</bdi>
                </p>
                <p className={cn('text-[11px] tabular-nums', u.error ? 'text-destructive' : 'text-muted-foreground')}>
                  {u.error ?? `${formatFileSize(u.size)} · ${u.progress}%`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => (u.error ? dropUpload(u.key) : u.controller.abort())}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={u.error ? 'إخفاء' : 'إلغاء الرفع'}
                title={u.error ? 'إخفاء' : 'إلغاء الرفع'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {!u.error && <Progress value={u.progress} label={`رفع ${u.name}`} className="h-1.5" />}
          </li>
        ))}
      </ul>

      {attachments.length === 0 && uploads.length === 0 && (
        <p className="text-center text-[11px] text-muted-foreground">لا توجد ملفات مرفقة.</p>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف الملف؟"
        description={
          <>
            سيتم حذف «<bdi className="font-semibold text-foreground">{toDelete?.fileName}</bdi>» ولن يظهر للطلاب بعد الآن.
          </>
        }
        confirmLabel="حذف"
        tone="danger"
        pending={removeAttachment.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => {
          setToDelete(null);
          setDeleteError(null);
        }}
      />
    </section>
  );
}
