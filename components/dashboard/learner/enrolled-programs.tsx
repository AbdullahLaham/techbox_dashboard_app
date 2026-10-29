// components/dashboard/learner/enrolled-programs.tsx
import Link from 'next/link';
import { Award, Compass, GraduationCap, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/dashboard/shared/dashboard-states';
import type { EnrolledProgram } from '@/types/dashboard';
import { NODE_TYPE_LABELS, PROGRAM_TYPE_LABELS } from '@/lib/labels';
import { formatNumber, formatPercent } from '@/lib/format';

function ProgramCard({ program }: { program: EnrolledProgram }) {
  const completed = program.progress >= 100;

  return (
    <article className="flex flex-col justify-between gap-5 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="gold">{PROGRAM_TYPE_LABELS[program.type]}</Badge>
          {completed && (
            <Badge variant="success">
              <Award /> مكتمل
            </Badge>
          )}
        </div>
        <h3 className="line-clamp-2 text-base font-bold text-foreground">{program.title}</h3>
        <p className="text-xs text-muted-foreground">
          المدرّب: <span className="font-medium text-foreground">{program.instructorName}</span>
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            {formatNumber(program.completedLessons)} من {formatNumber(program.totalLessons)} درساً
          </span>
          <bdi className="font-bold text-foreground tabular-nums">{formatPercent(program.progress)}</bdi>
        </div>
        <Progress
          value={program.progress}
          label={`تقدّمك في ${program.title}`}
          indicatorClassName={completed ? 'bg-emerald-500' : undefined}
        />
      </div>

      {program.nextLesson && (
        <div className="space-y-1 rounded-xl bg-muted/50 p-3 text-xs">
          <span className="text-[10px] font-semibold text-muted-foreground">
            التالي · {NODE_TYPE_LABELS[program.nextLesson.type]}
          </span>
          <p className="truncate font-medium text-foreground">{program.nextLesson.title}</p>
        </div>
      )}

      <Link
        href={`/programs/${program.slug}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        {completed ? (
          <>
            <GraduationCap className="h-3.5 w-3.5" /> مراجعة البرنامج
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5 fill-current rtl:-scale-x-100" /> متابعة التعلّم
          </>
        )}
      </Link>
    </article>
  );
}

export function EnrolledPrograms({ programs }: { programs: readonly EnrolledProgram[] }) {
  if (programs.length === 0) {
    return (
      <EmptyState icon={Compass} title="لم تسجّل في أي برنامج بعد" description="تصفّح دليل البرامج وابدأ رحلتك.">
        <Link href="/programs" className="text-xs font-semibold text-gold hover:underline">
          استكشف البرامج
        </Link>
      </EmptyState>
    );
  }

  // In-progress first (least advanced first), completed last.
  const sorted = [...programs].sort((a, b) => {
    const aDone = a.progress >= 100;
    const bDone = b.progress >= 100;
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.progress - b.progress;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sorted.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </div>
  );
}
