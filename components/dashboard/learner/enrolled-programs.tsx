// components/dashboard/learner/enrolled-programs.tsx
import Link from 'next/link';
import { Award, Clock, Compass, Eye, GraduationCap, PauseCircle, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { PROGRAM_TYPE_LABELS } from '@/lib/labels';
import { formatNumber, formatPercent } from '@/lib/format';
import type { EnrollmentStatus, MyEnrollment } from '@/types/api.contract';

/** Enrollments shown on the dashboard: in progress, finished, paused, or waiting for review. */
export const DASHBOARD_ENROLLMENT_STATUSES: readonly EnrollmentStatus[] = ['ACTIVE', 'COMPLETED', 'SUSPENDED', 'PENDING'];

export function isEnrollmentFinished(e: MyEnrollment): boolean {
  return e.status === 'COMPLETED' || (e.status === 'ACTIVE' && e.totalLessons > 0 && e.progressPct >= 100);
}

function StatusBadge({ enrollment }: { enrollment: MyEnrollment }) {
  if (isEnrollmentFinished(enrollment)) {
    return (
      <Badge variant="success">
        <Award /> مكتمل
      </Badge>
    );
  }
  if (enrollment.status === 'SUSPENDED') {
    return (
      <Badge variant="warning">
        <PauseCircle /> موقوف مؤقتاً
      </Badge>
    );
  }
  if (enrollment.status === 'PENDING') {
    return (
      <Badge variant="muted">
        <Clock /> قيد المراجعة
      </Badge>
    );
  }
  return null;
}

function ProgramCard({ enrollment }: { enrollment: MyEnrollment }) {
  const { program } = enrollment;
  const finished = isEnrollmentFinished(enrollment);
  const pending = enrollment.status === 'PENDING';
  const pct = enrollment.progressPct;

  return (
    <article className="flex flex-col justify-between gap-5 rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="gold">{PROGRAM_TYPE_LABELS[program.type]}</Badge>
          <StatusBadge enrollment={enrollment} />
        </div>
        <h3 className="line-clamp-2 text-base font-bold text-foreground">{program.title}</h3>
      </div>

      {pending ? (
        <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">يُفتح المحتوى بعد قبول طلبك من فريق الحاضنة.</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {formatNumber(enrollment.completedLessons)} من {formatNumber(enrollment.totalLessons)} درساً
            </span>
            <bdi className="font-bold text-foreground tabular-nums">{formatPercent(pct, Number.isInteger(pct) ? 0 : 1)}</bdi>
          </div>
          <Progress value={pct} label={`تقدّمك في ${program.title}`} indicatorClassName={finished ? 'bg-emerald-500' : undefined} />
        </div>
      )}

      <Link
        href={`/programs/${encodeURIComponent(program.slug)}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        {pending || enrollment.status === 'SUSPENDED' ? (
          <>
            <Eye className="h-3.5 w-3.5" /> عرض البرنامج
          </>
        ) : finished ? (
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

/** Order: in progress (least advanced first), then waiting, paused, finished. */
function rank(e: MyEnrollment): number {
  if (isEnrollmentFinished(e)) return 3;
  if (e.status === 'ACTIVE') return 0;
  return e.status === 'PENDING' ? 1 : 2;
}

export function EnrolledPrograms({ enrollments }: { enrollments: readonly MyEnrollment[] }) {
  const shown = enrollments.filter((e) => DASHBOARD_ENROLLMENT_STATUSES.includes(e.status));

  if (shown.length === 0) {
    return (
      <EmptyState icon={Compass} title="لم تسجّل في أي برنامج بعد" description="تصفّح دليل البرامج وابدأ رحلتك.">
        <Link href="/programs" className="text-xs font-semibold text-gold hover:underline">
          استكشف البرامج
        </Link>
      </EmptyState>
    );
  }

  const sorted = [...shown].sort((a, b) => rank(a) - rank(b) || a.progressPct - b.progressPct);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {sorted.map((enrollment) => (
        <ProgramCard key={enrollment.id} enrollment={enrollment} />
      ))}
    </div>
  );
}
