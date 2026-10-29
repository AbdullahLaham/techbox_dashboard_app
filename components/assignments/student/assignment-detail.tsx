// components/assignments/student/assignment-detail.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Download, FileQuestion } from 'lucide-react';
import { DashboardError } from '@/components/dashboard/shared/dashboard-states';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentStateBadge, DeadlineText, NewPill } from '@/components/assignments/student/assignment-badges';
import { ScoreBar } from '@/components/assignments/student/assignment-card';
import { fileIconFor } from '@/components/submissions/submission-parts';
import { HandInPanel } from '@/components/submissions/student/hand-in-panel';
import { assignmentKeys, useAssignment } from '@/hooks/use-assignments';
import { describeDeadline, formatFileSize } from '@/lib/assignment-format';
import { SUBMISSION_TYPE_LABELS } from '@/lib/labels';
import { isAssignmentNotFound } from '@/services/assignments-service';
import { getAssignmentState, type AssignmentAttachmentDto } from '@/types/assignments.contract';

/** Signed file URLs last about an hour; past this age, fetch fresh ones before opening a file (spec §10.4). */
const URL_MAX_AGE_MS = 50 * 60 * 1000;

function isUrlStale(fetchedAt: number): boolean {
  return Date.now() - fetchedAt >= URL_MAX_AGE_MS;
}

/** Refetches the detail and opens the attachment with its fresh signed URL. */
async function openWithFreshUrl(
  attachmentId: string,
  fetchAttachments: () => Promise<AssignmentAttachmentDto[] | undefined>,
): Promise<void> {
  // Open the tab synchronously (still inside the click) so popup blockers allow it.
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  try {
    const url = (await fetchAttachments())?.find((a) => a.id === attachmentId)?.url;
    if (!url) throw new Error('Attachment no longer available');
    if (tab) tab.location.assign(url);
    else window.location.assign(url);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

function BackLink() {
  return (
    <Link href="/assignments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
      <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> العودة إلى واجباتي
    </Link>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="جارٍ تحميل الواجب">
      <Skeleton className="h-28 rounded-3xl" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}

export function AssignmentDetailView({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: assignment, isPending, isError, error, refetch, dataUpdatedAt } = useAssignment(id);
  const [now] = useState(() => Date.now());
  const [fileError, setFileError] = useState<string | null>(null);

  if (isPending) return <DetailSkeleton />;

  if (isAssignmentNotFound(error)) {
    // Unpublished, archived or deleted since the list loaded: refresh the list on the way back.
    const backToList = () => {
      void queryClient.invalidateQueries({ queryKey: assignmentKeys.list() });
      router.push('/assignments');
    };
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed bg-card/50 p-10 text-center">
        <div className="rounded-2xl bg-gold/10 p-4 text-gold">
          <FileQuestion className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-lg font-extrabold text-foreground">هذا الواجب لم يعد متاحاً</h1>
        <p className="max-w-sm text-sm text-muted-foreground">ربما أُلغي نشره أو أُرشف من قبل الإدارة.</p>
        <button
          type="button"
          onClick={backToList}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          العودة إلى واجباتي
        </button>
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="space-y-4">
        <BackLink />
        <DashboardError onRetry={() => void refetch()} />
      </div>
    );
  }

  const state = getAssignmentState(assignment);
  const deadline = describeDeadline(assignment, now);
  const submission = assignment.submission;

  const openFile = (event: React.MouseEvent<HTMLAnchorElement>, file: AssignmentAttachmentDto) => {
    setFileError(null);
    if (!isUrlStale(dataUpdatedAt)) return; // let the link open normally
    event.preventDefault();
    void openWithFreshUrl(file.id, async () => (await refetch()).data?.attachments).catch(() =>
      setFileError('تعذّر فتح الملف. حاول مرة أخرى.'),
    );
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-3 border-b pb-5">
        <BackLink />
        <p className="text-xs font-semibold text-gold">{assignment.program.title}</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{assignment.title}</h1>
          {assignment.isNew && <NewPill />}
          <AssignmentStateBadge state={state} />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
          <DeadlineText text={deadline.text} tone={deadline.tone} />
          <span>نوع التسليم: {SUBMISSION_TYPE_LABELS[assignment.allowedType]}</span>
          <span className="tabular-nums">الدرجة العظمى: {assignment.maxScore}</span>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="instructions-heading">
            <h2 id="instructions-heading" className="text-base font-bold text-foreground">
              التعليمات
            </h2>
            <p dir="auto" className="text-sm leading-loose whitespace-pre-wrap text-foreground/90">
              {assignment.instructions}
            </p>
          </section>

          <HandInPanel assignmentId={assignment.id} />
        </div>

        <div className="space-y-6">
          <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="files-heading">
            <h2 id="files-heading" className="text-base font-bold text-foreground">
              ملفات مرفقة
            </h2>
            {assignment.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد ملفات مرفقة بهذا الواجب.</p>
            ) : (
              <ul className="space-y-2">
                {assignment.attachments.map((file) => {
                  const Icon = fileIconFor(file.mimeType);
                  return (
                    <li key={file.id}>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => openFile(e, file)}
                        className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:border-gold/40 hover:bg-muted/30"
                      >
                        <Icon className="h-5 w-5 shrink-0 text-gold" aria-hidden />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold text-foreground">
                            <bdi>{file.fileName}</bdi>
                          </span>
                          <span className="block text-[11px] text-muted-foreground tabular-nums">{formatFileSize(file.sizeBytes)}</span>
                        </span>
                        <Download className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
            {fileError && (
              <p role="alert" className="text-[11px] text-destructive">
                {fileError}
              </p>
            )}
          </section>

          {submission && state === 'GRADED' && (
            <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="score-heading">
              <h2 id="score-heading" className="text-base font-bold text-foreground">
                النتيجة
              </h2>
              <ScoreBar score={submission.score} maxScore={assignment.maxScore} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
