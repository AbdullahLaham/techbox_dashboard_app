// app/(client)/programs/[slug]/page.tsx
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  PlayCircle,
  FileText,
  Loader2,
  Video,
  ArrowRight,
  Lock,
  Clock,
  XCircle,
  CheckCircle2,
  ListChecks,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { useProgramDetail } from '@/hooks/use-programs';
import { useClassroomStore } from '@/store/use-classroom-store';
import { useAuthStore } from '@/store/use-auth-store';
import { EnrollmentApplyDialog } from '@/components/programs/enrollment-apply-dialog';
import { LessonView } from '@/components/lessons/student/lesson-view';
import { Progress } from '@/components/ui/progress';
import { buildLoginUrl } from '@/lib/auth/rbac';
import { formatNumber, formatPercent } from '@/lib/format';
import { type NodeType, type PublicProgram } from '@/types/program';
import { canApply, type EnrollmentBlockReason, type MyEnrollmentRef } from '@/types/api.contract';

const NODE_ICONS: Partial<Record<NodeType, { icon: LucideIcon; className: string }>> = {
  VIDEO_LECTURE: { icon: Video, className: 'text-blue-500' },
  QUIZ: { icon: ListChecks, className: 'text-violet-500' },
  ASSIGNMENT: { icon: ClipboardList, className: 'text-emerald-600' },
};
const DEFAULT_NODE_ICON = { icon: FileText, className: 'text-amber-500' };

const BLOCK_REASON_TEXT: Record<EnrollmentBlockReason, string> = {
  NOT_AVAILABLE: 'هذا البرنامج لا يستقبل طلبات حالياً.',
  CLOSED: 'التسجيل في هذه الدفعة مغلق حالياً.',
  ENDED: 'انتهت هذه الدفعة.',
  FULL: 'اكتملت المقاعد في هذه الدفعة.',
};

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function ProgramClassroomPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeParam(use(params).slug);
  const { data: program, isLoading, isError } = useProgramDetail(slug);
  const { activeNodeId, setActiveNodeId } = useClassroomStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">البرنامج غير موجود</h2>
        <Link href="/programs" className="text-xs text-gold underline">العودة إلى كتالوج البرامج</Link>
      </div>
    );
  }

  const nodes = program.tracks.flatMap((t) => t.modules.flatMap((m) => m.nodes));
  // Only a lesson of this program counts (the store outlives the page).
  const activeNode = nodes.find((n) => n.id === activeNodeId) ?? null;
  const enrollment = program.myEnrollment;
  // The server saves progress for ACTIVE and COMPLETED enrollments only (staff previews are not saved).
  const canRecord = program.canAccessContent && (enrollment?.status === 'ACTIVE' || enrollment?.status === 'COMPLETED');

  return (
    <div className="space-y-6 pb-10">
      {/* شريط التنقل العلوي للرجوع */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <Link href="/programs" className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline font-semibold">
            <ArrowRight className="h-3.5 w-3.5" /> العودة لقائمة البرامج
          </Link>
          <h1 className="text-2xl font-extrabold text-foreground">{program.title}</h1>
        </div>
      </div>

      <EnrollmentBanner program={program} />

      {/* تخطيط الفصول: المحتوى الرئيسي على اليمين والشجرة على اليسار */}
      <div className="grid lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          {activeNode ? (
            <LessonView key={activeNode.id} node={activeNode} programSlug={program.slug} canRecord={canRecord} />
          ) : (
            <div className="flex flex-col items-center justify-center h-96 rounded-3xl border border-dashed p-8 text-center bg-card">
              <PlayCircle className="h-12 w-12 text-gold mb-3" />
              <h3 className="font-bold text-base text-foreground">اختر درساً أو محاضرة للبدء في التعلم</h3>
              <p className="text-xs text-muted-foreground mt-1">انقر على أي درس من شجرة المنهج لعرض محتواه.</p>
            </div>
          )}
        </div>

        {/* شجرة المنهج الجانبية */}
        <div className="rounded-3xl border bg-card p-5 shadow-sm space-y-4 sticky top-28">
          <h3 className="font-extrabold text-sm border-b pb-3 text-foreground">محتويات المنهج الدراسي</h3>
          {canRecord && enrollment && <ProgramProgressBar enrollment={enrollment} />}
          <div className="space-y-5 max-h-[65vh] overflow-y-auto pl-1">
            {program.tracks.map((track, trackIdx) => (
              <div key={track.id} className="space-y-2.5">
                <div className="bg-muted/50 p-2 rounded-xl">
                  <span className="text-[10px] font-bold text-gold block">المسار {trackIdx + 1}</span>
                  <h4 className="text-xs font-bold text-foreground">{track.title}</h4>
                </div>

                <div className="space-y-3 pr-2 border-r-2 border-border mr-1">
                  {track.modules.map((mod) => (
                    <div key={mod.id} className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground block pr-2">{mod.title}</span>
                      <div className="space-y-1 pr-2">
                        {mod.nodes.map((node) => {
                          const isSelected = activeNode?.id === node.id;
                          const { icon: Icon, className: iconClass } = NODE_ICONS[node.type] ?? DEFAULT_NODE_ICON;
                          return (
                            <button
                              key={node.id}
                              onClick={() => setActiveNodeId(node.id)}
                              aria-current={isSelected ? 'true' : undefined}
                              className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-xs text-right transition-all ${
                                isSelected
                                  ? 'bg-navy-900 text-white dark:bg-gold dark:text-navy-900 font-bold shadow-sm'
                                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <Icon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-gold dark:text-navy-900' : iconClass}`} aria-hidden />
                                <span className="truncate">{node.title}</span>
                              </span>
                              {node.isLocked ? (
                                <Lock className="h-3 w-3 shrink-0 opacity-60" aria-label="مقفل" />
                              ) : node.isCompleted ? (
                                <CheckCircle2
                                  className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-emerald-300 dark:text-emerald-700' : 'text-emerald-500'}`}
                                  aria-label="مكتمل"
                                />
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgramProgressBar({ enrollment }: { enrollment: MyEnrollmentRef }) {
  const pct = enrollment.progressPct;
  return (
    <div className="space-y-1.5 rounded-xl bg-muted/40 p-3">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">
          {formatNumber(enrollment.completedLessons)} من {formatNumber(enrollment.totalLessons)} درساً
        </span>
        <bdi className="font-bold text-foreground tabular-nums">{formatPercent(pct, Number.isInteger(pct) ? 0 : 1)}</bdi>
      </div>
      <Progress value={pct} label="تقدّمك في البرنامج" indicatorClassName={pct >= 100 ? 'bg-emerald-500' : undefined} />
    </div>
  );
}

function EnrollmentBanner({ program }: { program: PublicProgram }) {
  const user = useAuthStore((s) => s.user);
  const [applying, setApplying] = useState(false);
  const enrollment = program.myEnrollment;
  const status = enrollment?.status ?? null;

  if (program.canAccessContent) {
    return enrollment ? (
      <Banner tone="success" icon={<CheckCircle2 className="h-4 w-4" />}>
        أنت مسجل في هذا البرنامج.{enrollment.reviewNote ? ` ملاحظة الإدارة: ${enrollment.reviewNote}` : ''}
      </Banner>
    ) : null; // staff preview
  }

  const applyButton = program.canEnroll && canApply(status) && (
    user ? (
      <button
        onClick={() => setApplying(true)}
        className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90"
      >
        {status ? 'إعادة التقديم' : 'سجّل الآن'}
      </button>
    ) : (
      <Link
        href={buildLoginUrl(`/programs/${encodeURIComponent(program.slug)}`)}
        className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90"
      >
        سجّل الدخول للتقديم
      </Link>
    )
  );

  let content: React.ReactNode;
  if (status === 'PENDING') {
    content = (
      <Banner tone="warning" icon={<Clock className="h-4 w-4" />}>
        طلبك قيد المراجعة من قِبل فريق الحاضنة، وسيُفتح المحتوى فور قبوله.
      </Banner>
    );
  } else if (status === 'SUSPENDED') {
    content = (
      <Banner tone="danger" icon={<XCircle className="h-4 w-4" />}>
        تم إيقاف وصولك لهذا البرنامج مؤقتاً.{enrollment?.reviewNote ? ` ${enrollment.reviewNote}` : ''}
      </Banner>
    );
  } else if (status === 'REJECTED' || status === 'DROPPED') {
    content = (
      <Banner tone="danger" icon={<XCircle className="h-4 w-4" />} action={applyButton}>
        {status === 'REJECTED' ? 'لم يتم قبول طلبك.' : 'لم تعد مسجلاً في هذا البرنامج.'}
        {enrollment?.reviewNote ? ` ملاحظة الإدارة: ${enrollment.reviewNote}` : ''}
        {!program.canEnroll && program.enrollmentBlockReason ? ` ${BLOCK_REASON_TEXT[program.enrollmentBlockReason]}` : ''}
      </Banner>
    );
  } else {
    content = (
      <Banner tone="gold" icon={<Lock className="h-4 w-4" />} action={applyButton}>
        {program.canEnroll
          ? `محتوى البرنامج متاح للطلاب المقبولين.${program.seats.remaining !== null ? ` المقاعد المتبقية: ${program.seats.remaining}.` : ''}`
          : BLOCK_REASON_TEXT[program.enrollmentBlockReason ?? 'NOT_AVAILABLE']}
      </Banner>
    );
  }

  return (
    <>
      {content}
      <EnrollmentApplyDialog open={applying} programId={program.id} programTitle={program.title} onClose={() => setApplying(false)} />
    </>
  );
}

const TONES = {
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'border-destructive/20 bg-destructive/10 text-destructive',
  gold: 'border-gold/25 bg-gold/10 text-foreground',
} as const;

function Banner({
  tone,
  icon,
  action,
  children,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 text-xs font-semibold sm:flex-row sm:items-center sm:justify-between ${TONES[tone]}`}>
      <span className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span>{children}</span>
      </span>
      {action}
    </div>
  );
}
