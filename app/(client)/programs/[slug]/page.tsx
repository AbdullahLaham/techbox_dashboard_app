// app/(client)/programs/[slug]/page.tsx
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { PlayCircle, FileText, Loader2, Video, ArrowRight, Lock, Clock, XCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useProgramDetail } from '@/hooks/use-programs';
import { useClassroomStore } from '@/store/use-classroom-store';
import { useAuthStore } from '@/store/use-auth-store';
import { EnrollmentApplyDialog } from '@/components/programs/enrollment-apply-dialog';
import { buildLoginUrl } from '@/lib/auth/rbac';
import { NodeType, type PublicNode, type PublicProgram } from '@/types/program';
import { NODE_TYPE_LABELS_AR, canApply, type EnrollmentBlockReason } from '@/types/api.contract';

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
            <LessonView node={activeNode} />
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
                          return (
                            <button
                              key={node.id}
                              onClick={() => setActiveNodeId(node.id)}
                              className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-xs text-right transition-all ${
                                isSelected
                                  ? 'bg-navy-900 text-white dark:bg-gold dark:text-navy-900 font-bold shadow-sm'
                                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                {node.type === NodeType.VIDEO_LECTURE ? (
                                  <Video className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-gold dark:text-navy-900' : 'text-blue-500'}`} />
                                ) : (
                                  <FileText className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-gold dark:text-navy-900' : 'text-amber-500'}`} />
                                )}
                                <span className="truncate">{node.title}</span>
                              </span>
                              {node.isLocked && <Lock className="h-3 w-3 shrink-0 opacity-60" aria-label="مقفل" />}
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

function LessonView({ node }: { node: PublicNode }) {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-6">
      <div className="space-y-2 border-b pb-4">
        <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20 inline-block">
          {NODE_TYPE_LABELS_AR[node.type]}
        </span>
        <h2 className="text-xl font-bold text-foreground">{node.title}</h2>
        {node.description && <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{node.description}</p>}
      </div>

      {node.isLocked ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted/40 p-10 text-center">
          <Lock className="h-8 w-8 text-gold" />
          <p className="text-sm font-bold text-foreground">هذا الدرس متاح للطلاب المقبولين في البرنامج</p>
          <p className="text-xs text-muted-foreground">قدّم طلب الانضمام، وسيُفتح المحتوى بعد موافقة فريق الحاضنة.</p>
        </div>
      ) : (
        <>
          {node.video?.playbackUrl && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border shadow-md">
              <iframe
                src={node.video.playbackUrl}
                title={node.title}
                className="w-full h-full"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>
          )}

          {node.assignment && (
            <div className="rounded-2xl bg-muted/40 p-6 space-y-4 border border-border">
              <h3 className="font-bold text-sm text-foreground">تعليمات المهمة المطلوبة:</h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{node.assignment.instructions}</p>
              <Link
                href={`/assignments/${node.assignment.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gold text-navy-900 px-5 py-2.5 text-xs font-bold shadow-md hover:bg-gold/90 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" /> فتح الواجب والملفات المرفقة
              </Link>
            </div>
          )}
        </>
      )}
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
