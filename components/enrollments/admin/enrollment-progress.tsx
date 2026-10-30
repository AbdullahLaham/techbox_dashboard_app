// components/enrollments/admin/enrollment-progress.tsx
import { Progress } from '@/components/ui/progress';
import { formatNumber, formatPercent } from '@/lib/format';
import type { AdminEnrollmentListItem, EnrollmentStatus } from '@/types/api.contract';

/** Statuses where the learner had access to the lessons, so progress means something. */
const WITH_PROGRESS: readonly EnrollmentStatus[] = ['ACTIVE', 'COMPLETED', 'SUSPENDED', 'DROPPED'];

type ProgressFields = Pick<AdminEnrollmentListItem, 'status' | 'progressPct' | 'completedLessons' | 'totalLessons'>;

/** Completed lessons out of the counted ones, with a bar. `compact` for table cells. */
export function EnrollmentProgress({ enrollment, compact = false }: { enrollment: ProgressFields; compact?: boolean }) {
  if (!WITH_PROGRESS.includes(enrollment.status)) return <span className="text-xs text-muted-foreground">—</span>;

  const { progressPct: pct, completedLessons, totalLessons } = enrollment;
  const done = pct >= 100;

  return (
    <div className={compact ? 'w-32 space-y-1' : 'space-y-1.5'}>
      <div className="flex justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground tabular-nums">
          {formatNumber(completedLessons)} / {formatNumber(totalLessons)} {compact ? '' : 'درساً'}
        </span>
        <bdi className="font-bold text-foreground tabular-nums">{formatPercent(pct, Number.isInteger(pct) ? 0 : 1)}</bdi>
      </div>
      <Progress
        value={pct}
        label={`أكمل ${completedLessons} من ${totalLessons} درساً`}
        className={compact ? 'h-1.5' : undefined}
        indicatorClassName={done ? 'bg-emerald-500' : undefined}
      />
    </div>
  );
}
