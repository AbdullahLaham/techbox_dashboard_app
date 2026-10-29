// components/lessons/admin/lesson-editor.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, ClipboardCheck, ExternalLink, FileQuestion, ListChecks, Settings2, Trash2, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { LessonForm } from '@/components/lessons/admin/lesson-form';
import { QuizAttempts } from '@/components/lessons/admin/quiz-attempts';
import { QuizQuestions } from '@/components/lessons/admin/quiz-questions';
import { QuizSettingsForm } from '@/components/lessons/admin/quiz-settings-form';
import { ReadingResourcePanel } from '@/components/lessons/admin/reading-resource-panel';
import { useAdminNode, useAdminQuiz, useDeleteLesson } from '@/hooks/use-admin-nodes';
import { useSession } from '@/hooks/use-session';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/assignment-format';
import { CONTENT_OWNER_ROLES, hasRole } from '@/lib/auth/rbac';
import { formatNumber } from '@/lib/format';
import { attemptHref, formatDuration, formatScore, isEmbeddableVideo, lessonHref, type LessonTab } from '@/lib/lessons';
import { cn } from '@/lib/utils';
import { NODE_TYPE_LABELS_AR } from '@/types/api.contract';
import type { AdminNodeDetail, ManagedNodeType } from '@/types/nodes.contract';

const TYPE_ICONS: Record<ManagedNodeType, React.ComponentType<{ className?: string }>> = {
  VIDEO_LECTURE: Video,
  READING_MATERIAL: BookOpen,
  QUIZ: ListChecks,
};

const QUIZ_TABS: { id: LessonTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'questions', label: 'الأسئلة والنشر', icon: ListChecks },
  { id: 'settings', label: 'إعدادات الاختبار', icon: Settings2 },
  { id: 'attempts', label: 'محاولات الطلاب', icon: ClipboardCheck },
  { id: 'lesson', label: 'بيانات الدرس', icon: BookOpen },
];

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function SummaryCard({ node }: { node: AdminNodeDetail }) {
  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm">
      <h2 className="mb-2 text-base font-bold text-foreground">ملخص</h2>
      <div className="divide-y">
        <Stat label="النوع" value={NODE_TYPE_LABELS_AR[node.type]} />
        <Stat label="الترتيب في الوحدة" value={node.orderIndex + 1} />
        {node.video && <Stat label="مدة الفيديو" value={<bdi>{formatDuration(node.video.durationSec)}</bdi>} />}
        {node.quiz && (
          <>
            <Stat label="الأسئلة" value={formatNumber(node.quiz.questionCount)} />
            <Stat label="مجموع الدرجات" value={formatScore(node.quiz.totalScore)} />
            <Stat label="درجة النجاح" value={formatScore(node.quiz.passingScore)} />
            <Stat label="المحاولات" value={formatNumber(node.quiz.attemptsCount)} />
          </>
        )}
        <Stat label="تاريخ الإنشاء" value={formatDateTime(node.createdAt)} />
        <Stat label="آخر تعديل" value={formatDateTime(node.updatedAt)} />
      </div>
    </section>
  );
}

function VideoPreview({ url }: { url: string }) {
  return (
    <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-sm" aria-labelledby="video-preview-heading">
      <h2 id="video-preview-heading" className="text-base font-bold text-foreground">
        معاينة
      </h2>
      {isEmbeddableVideo(url) ? (
        <div className="aspect-video overflow-hidden rounded-2xl border bg-black">
          <iframe
            src={url}
            title="معاينة الفيديو"
            loading="lazy"
            allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">لا تتوفر معاينة لهذا الرابط داخل اللوحة.</p>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
        فتح الفيديو في نافذة جديدة <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </section>
  );
}

function QuizWorkspace({ node, programSlug, initialTab }: { node: AdminNodeDetail; programSlug?: string; initialTab?: LessonTab }) {
  const [tab, setTab] = useState<LessonTab>(initialTab ?? 'questions');
  const { data: quiz, isPending, isError, refetch } = useAdminQuiz(node.quiz?.id);

  const selectTab = (next: LessonTab) => {
    setTab(next);
    // Keep the tab in the URL so reloads and the browser's back button return to it.
    window.history.replaceState(null, '', lessonHref(node.id, { program: programSlug, tab: next }));
  };

  let content: React.ReactNode;
  if (tab === 'lesson') content = <LessonForm node={node} />;
  else if (!node.quiz) content = <DashboardError onRetry={() => void refetch()} />;
  else if (tab === 'attempts') {
    content = <QuizAttempts quizId={node.quiz.id} attemptHref={(id) => attemptHref(node.id, id, programSlug)} />;
  } else if (isPending) content = <Skeleton className="h-96 rounded-3xl" />;
  else if (isError || !quiz) content = <DashboardError onRetry={() => void refetch()} />;
  else if (tab === 'settings') content = <QuizSettingsForm key={quiz.id} quiz={quiz} />;
  else content = <QuizQuestions quiz={quiz} />;

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="أقسام الاختبار" className="flex gap-1 overflow-x-auto rounded-2xl border bg-card p-1 shadow-sm">
        {QUIZ_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => selectTab(id)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors',
              tab === id ? 'bg-navy-900 text-white dark:bg-gold dark:text-navy-900' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {tab === 'attempts' ? (
        <div role="tabpanel">{content}</div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div role="tabpanel" className="lg:col-span-2">
            {content}
          </div>
          <SummaryCard node={node} />
        </div>
      )}
    </div>
  );
}

interface LessonEditorProps {
  nodeId: string;
  /** Slug of the program the editor was opened from, for the back link. */
  programSlug?: string;
  initialTab?: LessonTab;
}

export function LessonEditor({ nodeId, programSlug, initialTab }: LessonEditorProps) {
  const router = useRouter();
  const { role } = useSession();
  const { data: node, isPending, isError, error, refetch } = useAdminNode(nodeId);
  const deleteLesson = useDeleteLesson();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const backHref = programSlug ? `/admin/content/${encodeURIComponent(programSlug)}` : '/admin/content';
  const backLink = (
    <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
      <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> {programSlug ? 'العودة إلى المنهج' : 'العودة إلى البرامج'}
    </Link>
  );

  if (isPending) {
    return (
      <div className="space-y-6" role="status" aria-label="جارٍ تحميل الدرس">
        <Skeleton className="h-24 rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[480px] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !node) {
    if (getApiErrorCode(error) === 'NOT_FOUND') {
      return (
        <div className="space-y-4">
          {backLink}
          <EmptyState
            icon={FileQuestion}
            title="الدرس غير موجود"
            description="ربما تم حذفه، أو أنه من نوع يُدار من مكان آخر (الواجبات تُدار من «إدارة الواجبات»)."
          />
        </div>
      );
    }
    return <DashboardError onRetry={() => void refetch()} />;
  }

  const TypeIcon = TYPE_ICONS[node.type];
  const deleteError = deleteLesson.error
    ? getApiErrorCode(deleteLesson.error) === 'QUIZ_HAS_ATTEMPTS'
      ? 'قدّم الطلاب محاولات على هذا الاختبار، ولا يمكن حذفه حتى لا تضيع نتائجهم. ألغِ نشره بدلاً من ذلك.'
      : getApiErrorMessage(deleteLesson.error, 'تعذّر حذف الدرس.')
    : null;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          {backLink}
          <p className="flex items-center gap-1.5 text-xs font-semibold text-gold">
            <TypeIcon className="h-3.5 w-3.5" aria-hidden /> {NODE_TYPE_LABELS_AR[node.type]}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-2xl font-extrabold tracking-tight text-foreground">{node.title}</h1>
            <Badge variant={node.isMandatory ? 'success' : 'muted'}>{node.isMandatory ? 'إلزامي' : 'اختياري'}</Badge>
            {node.quiz && (
              <Badge variant={node.quiz.isPublished ? 'success' : 'muted'}>{node.quiz.isPublished ? 'منشور' : 'غير منشور'}</Badge>
            )}
          </div>
          {node.description && <p className="max-w-2xl text-xs text-muted-foreground">{node.description}</p>}
        </div>
        {hasRole(role, CONTENT_OWNER_ROLES) && (
          <button
            type="button"
            onClick={() => {
              deleteLesson.reset();
              setConfirmDelete(true);
            }}
            className="flex w-fit items-center gap-1.5 rounded-xl border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> حذف الدرس
          </button>
        )}
      </div>

      {node.type === 'QUIZ' ? (
        <QuizWorkspace node={node} programSlug={programSlug} initialTab={initialTab} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LessonForm key={node.id} node={node} />
          </div>
          <div className="space-y-6">
            {node.type === 'READING_MATERIAL' && <ReadingResourcePanel key={node.id} node={node} />}
            {node.video && <VideoPreview url={node.video.playbackUrl} />}
            <SummaryCard node={node} />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="حذف الدرس؟"
        description={
          <>
            سيُحذف «<strong>{node.title}</strong>» نهائياً
            {node.type === 'QUIZ' ? ' مع اختباره وأسئلته' : node.type === 'READING_MATERIAL' ? ' مع ملفه' : ''}. لا يمكن التراجع عن ذلك.
          </>
        }
        confirmLabel="حذف نهائي"
        tone="danger"
        pending={deleteLesson.isPending}
        error={deleteError}
        onConfirm={() => deleteLesson.mutate(node.id, { onSuccess: () => router.replace(backHref) })}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
