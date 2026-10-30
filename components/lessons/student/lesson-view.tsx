// components/lessons/student/lesson-view.tsx
// One lesson in the program classroom. Videos save the learner's position (resumed next time),
// reading material has a "done" button, quizzes show the learner's standing.
'use client';

import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, ExternalLink, Info, ListChecks, Loader2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { fileIconFor } from '@/components/submissions/submission-parts';
import { useLessonContent, useUpdateLessonProgress } from '@/hooks/use-lessons';
import { usePlayerJs, withStartTime, type PlayerEvent } from '@/hooks/use-player-js';
import { nodesApi } from '@/services/nodes-service';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatFileSize } from '@/lib/assignment-format';
import { formatDuration, formatScore } from '@/lib/lessons';
import { NODE_TYPE_LABELS_AR } from '@/types/api.contract';
import type { PublicNode } from '@/types/program';
import type { NodeContent } from '@/types/nodes.contract';

/** Save the video position this often while it plays (and on pause, end and leave). */
const SAVE_EVERY_MS = 15_000;
/** Resume only past the first seconds and before the very end. */
const RESUME_MIN_SEC = 5;
const RESUME_END_MARGIN_SEC = 10;

interface LessonViewProps {
  node: PublicNode;
  programSlug: string;
  /** The caller is a learner whose progress is saved (ACTIVE or COMPLETED enrollment); false for staff previews. */
  canRecord: boolean;
}

export function LessonView({ node, programSlug, canRecord }: LessonViewProps) {
  return (
    <div className="space-y-6 rounded-3xl border bg-card p-6 shadow-sm">
      <div className="space-y-2 border-b pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-gold uppercase">
            {NODE_TYPE_LABELS_AR[node.type]}
          </span>
          {node.isCompleted && (
            <Badge variant="success">
              <CheckCircle2 /> مكتمل
            </Badge>
          )}
          {!node.isMandatory && <Badge variant="muted">اختياري</Badge>}
        </div>
        <h2 className="text-xl font-bold text-foreground">{node.title}</h2>
        {node.description && <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground">{node.description}</p>}
      </div>

      {node.isLocked ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/40 p-10 text-center">
          <Lock className="h-8 w-8 text-gold" />
          <p className="text-sm font-bold text-foreground">هذا الدرس متاح للطلاب المقبولين في البرنامج</p>
          <p className="text-xs text-muted-foreground">قدّم طلب الانضمام، وسيُفتح المحتوى بعد موافقة فريق الحاضنة.</p>
        </div>
      ) : node.type === 'VIDEO_LECTURE' ? (
        <VideoLesson node={node} programSlug={programSlug} canRecord={canRecord} />
      ) : node.type === 'READING_MATERIAL' ? (
        <ReadingLesson node={node} programSlug={programSlug} canRecord={canRecord} />
      ) : node.type === 'QUIZ' ? (
        <QuizLesson node={node} />
      ) : node.assignment ? (
        <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-6">
          <h3 className="text-sm font-bold text-foreground">تعليمات المهمة المطلوبة:</h3>
          <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground">{node.assignment.instructions}</p>
          <Link
            href={`/assignments/${encodeURIComponent(node.assignment.id)}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-navy-900 shadow-md transition-all hover:bg-gold/90"
          >
            <ExternalLink className="h-3.5 w-3.5" /> فتح الواجب والملفات المرفقة
          </Link>
          {canRecord && !node.isCompleted && <p className="text-[11px] text-muted-foreground">يُحتسب الدرس مكتملاً بعد تقييم تسليمك.</p>}
        </div>
      ) : null}

      {!canRecord && !node.isLocked && (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5" aria-hidden /> معاينة: لا يُسجَّل التقدّم في هذا العرض.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------- Video --------------------------------- */

function VideoLesson({ node, programSlug, canRecord }: LessonViewProps) {
  // Learners need their resume position before the player loads; staff play straight away.
  const content = useLessonContent(node.id, { enabled: canRecord });
  const playbackUrl = content.data?.video?.playbackUrl ?? node.video?.playbackUrl ?? null;
  const durationSec = content.data?.video?.durationSec ?? node.video?.durationSec ?? 0;

  if (canRecord && content.isPending) return <Skeleton className="aspect-video w-full rounded-2xl" role="status" aria-label="جارٍ تحميل الفيديو" />;
  if (!playbackUrl) return <p className="text-xs text-muted-foreground">الفيديو غير متاح حالياً.</p>;

  const last = content.data?.progress.lastPositionSec ?? 0;
  const startAt = last >= RESUME_MIN_SEC && (durationSec === 0 || last < durationSec - RESUME_END_MARGIN_SEC) ? last : 0;

  return (
    <div className="space-y-4">
      {/* Keyed so a new URL (or another lesson) starts a fresh player and tracker. */}
      <VideoPlayer
        key={`${node.id}:${playbackUrl}`}
        nodeId={node.id}
        title={node.title}
        playbackUrl={playbackUrl}
        startAt={startAt}
        programSlug={programSlug}
        canRecord={canRecord}
      />
      {canRecord && content.data && <VideoProgress content={content.data} programSlug={programSlug} />}
    </div>
  );
}

interface VideoPlayerProps {
  nodeId: string;
  title: string;
  playbackUrl: string;
  startAt: number;
  programSlug: string;
  canRecord: boolean;
}

function VideoPlayer({ nodeId, title, playbackUrl, startAt, programSlug, canRecord }: VideoPlayerProps) {
  // Fixed for the life of the player: saved positions must not reload the iframe.
  const [resumeAt] = useState(startAt);
  const [src] = useState(() => withStartTime(playbackUrl, startAt));
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { mutate: save } = useUpdateLessonProgress(nodeId, programSlug);

  const position = useRef<number | null>(null);
  const lastSaved = useRef<{ position: number; at: number } | null>(null);

  /** Sends the current position if it changed. `onExit` uses a request that survives the page closing. */
  const flush = useCallback(
    (onExit = false) => {
      const current = position.current;
      if (!canRecord || current === null || current === lastSaved.current?.position) return;
      lastSaved.current = { position: current, at: Date.now() };
      if (onExit) nodesApi.sendProgressOnExit(nodeId, { positionSec: current });
      else save({ positionSec: current });
    },
    [canRecord, nodeId, save],
  );

  const onPlayerEvent = (event: PlayerEvent) => {
    switch (event.type) {
      case 'timeupdate': {
        position.current = Math.floor(event.seconds);
        // The first save waits a full interval, so opening a video and leaving it records nothing.
        lastSaved.current ??= { position: resumeAt, at: Date.now() };
        if (Date.now() - lastSaved.current.at >= SAVE_EVERY_MS) flush();
        break;
      }
      case 'ended':
        if (position.current !== null) flush();
        break;
      case 'pause':
        flush();
        break;
    }
  };
  const { subscribe } = usePlayerJs(iframeRef, src, onPlayerEvent);

  // Leaving: another lesson or page (unmount), or the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush(true);
    };
    const onPageHide = () => flush(true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
      flush();
    };
  }, [flush]);

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-md">
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          onLoad={subscribe}
          className="h-full w-full"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      </div>
      {src !== playbackUrl && (
        <p className="text-[11px] text-muted-foreground">
          يُستأنف الفيديو من حيث توقفت (<bdi className="tabular-nums">{formatDuration(resumeAt)}</bdi>).
        </p>
      )}
    </div>
  );
}

function VideoProgress({ content, programSlug }: { content: NodeContent; programSlug: string }) {
  const { progress } = content;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      {progress.isCompleted ? (
        <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> أكملت مشاهدة هذا الدرس.
        </p>
      ) : (
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>نسبة المشاهدة</span>
            <bdi className="font-bold text-foreground tabular-nums">{Math.round(progress.completionPct)}%</bdi>
          </div>
          <Progress value={progress.completionPct} label="نسبة مشاهدة الفيديو" />
          <p className="text-[11px] text-muted-foreground">يُحتسب الدرس مكتملاً بعد مشاهدة 90% منه.</p>
        </div>
      )}
      {!progress.isCompleted && <DoneButton nodeId={content.id} programSlug={programSlug} label="تعليم كمكتمل" variant="secondary" />}
    </div>
  );
}

/* --------------------------------- Reading -------------------------------- */

function ReadingLesson({ node, programSlug, canRecord }: LessonViewProps) {
  const { data, isPending, isError, refetch } = useLessonContent(node.id);

  if (isPending) return <Skeleton className="h-28 rounded-2xl" role="status" aria-label="جارٍ تحميل المادة" />;
  if (isError) {
    return (
      <p className="text-xs text-destructive">
        تعذّر تحميل المادة.{' '}
        <button type="button" onClick={() => void refetch()} className="underline">
          إعادة المحاولة
        </button>
      </p>
    );
  }

  const resource = data.resource;
  const isCompleted = data.progress.isCompleted || node.isCompleted;

  return (
    <div className="space-y-4">
      {resource ? (
        <ResourceCard resource={resource} />
      ) : (
        <p className="rounded-2xl bg-muted/40 p-6 text-center text-xs text-muted-foreground">لم تُضف المادة بعد.</p>
      )}

      {canRecord &&
        (isCompleted ? (
          <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> أنهيت هذه المادة.
          </p>
        ) : (
          <DoneButton nodeId={node.id} programSlug={programSlug} label="تم الانتهاء" />
        ))}
    </div>
  );
}

function ResourceCard({ resource }: { resource: NonNullable<NodeContent['resource']> }) {
  if (resource.kind === 'LINK') {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 p-4 transition-colors hover:border-gold/50"
      >
        <span className="min-w-0">
          <span className="block text-sm font-bold text-foreground">فتح المادة</span>
          <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">
            {resource.url}
          </span>
        </span>
        <ExternalLink className="h-4 w-4 shrink-0 text-gold" aria-hidden />
      </a>
    );
  }

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-2xl border bg-muted/20 p-4 transition-colors hover:border-gold/50"
    >
      {createElement(fileIconFor(resource.mimeType ?? ''), { className: 'h-8 w-8 shrink-0 text-gold', 'aria-hidden': true })}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">{resource.fileName ?? 'ملف المادة'}</span>
        {resource.sizeBytes !== null && <span className="block text-[11px] text-muted-foreground">{formatFileSize(resource.sizeBytes)}</span>}
      </span>
      <Download className="h-4 w-4 shrink-0 text-gold" aria-hidden />
      <span className="sr-only">تنزيل</span>
    </a>
  );
}

/* ---------------------------------- Quiz ---------------------------------- */

function QuizLesson({ node }: { node: PublicNode }) {
  const { data, isPending, isError, refetch } = useLessonContent(node.id);

  if (isPending) return <Skeleton className="h-28 rounded-2xl" role="status" aria-label="جارٍ تحميل الاختبار" />;
  if (isError) {
    return (
      <p className="text-xs text-destructive">
        تعذّر تحميل الاختبار.{' '}
        <button type="button" onClick={() => void refetch()} className="underline">
          إعادة المحاولة
        </button>
      </p>
    );
  }

  const quiz = data.quiz;
  if (!quiz) return <p className="rounded-2xl bg-muted/40 p-6 text-center text-xs text-muted-foreground">الاختبار غير منشور بعد.</p>;

  return (
    <div className="space-y-4 rounded-2xl border bg-muted/20 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ListChecks className="h-4 w-4 text-gold" /> {quiz.title}
        </h3>
        {quiz.passed && (
          <Badge variant="success">
            <CheckCircle2 /> ناجح
          </Badge>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <Stat label="الأسئلة" value={String(quiz.questionCount)} />
        <Stat label="درجة النجاح" value={`${formatScore(quiz.passingScore)} / ${formatScore(quiz.totalScore)}`} />
        <Stat label="أفضل نتيجة" value={quiz.bestScore === null ? '—' : formatScore(quiz.bestScore)} />
        <Stat
          label="المحاولات"
          value={quiz.maxAttempts === null ? `${quiz.attemptsUsed} (غير محدودة)` : `${quiz.attemptsUsed} / ${quiz.maxAttempts}`}
        />
      </dl>
      <p className="text-[11px] text-muted-foreground">حلّ الاختبارات متاح حالياً من تطبيق TechBox على الجوال، ويُحتسب الدرس مكتملاً عند النجاح.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card p-3">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-bold text-foreground tabular-nums">
        <bdi>{value}</bdi>
      </dd>
    </div>
  );
}

/* ---------------------------------- Shared --------------------------------- */

function DoneButton({
  nodeId,
  programSlug,
  label,
  variant = 'primary',
}: {
  nodeId: string;
  programSlug: string;
  label: string;
  variant?: 'primary' | 'secondary';
}) {
  const { mutate, isPending, error } = useUpdateLessonProgress(nodeId, programSlug);
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => mutate({ completed: true })}
        disabled={isPending}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-xs font-bold text-navy-900 shadow-md transition-all hover:bg-gold/90 disabled:opacity-60'
            : 'inline-flex shrink-0 items-center gap-2 rounded-xl border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60'
        }
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        {label}
      </button>
      {error && (
        <p role="alert" className="text-[11px] text-destructive">
          {getApiErrorMessage(error, 'تعذّر حفظ التقدّم.')}
        </p>
      )}
    </div>
  );
}
