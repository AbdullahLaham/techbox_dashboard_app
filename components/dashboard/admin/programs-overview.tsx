// components/dashboard/admin/programs-overview.tsx
import Link from 'next/link';
import { CalendarDays, ClipboardList, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { PROGRAM_STATUS_LABELS_AR } from '@/types/api.contract';
import type { AdminOverviewProgram } from '@/types/admin-overview.contract';
import { formatNumber, formatPercent, formatShortDate } from '@/lib/format';

function seatsText(p: AdminOverviewProgram): string {
  const taken = p.active + p.completed;
  return p.maxSeats === null
    ? `${formatNumber(taken)} متعلم · مقاعد غير محدودة`
    : `${formatNumber(taken)} من ${formatNumber(p.maxSeats)} مقعداً`;
}

/**
 * Catalog programs (published or running) with their learners, open applications and the mean
 * progress of their active learners. Counted by GET /v1/admin/overview.
 */
export function ProgramsOverview({
  programs,
  canManageContent,
  canReviewEnrollments,
}: {
  programs: readonly AdminOverviewProgram[];
  canManageContent: boolean;
  canReviewEnrollments: boolean;
}) {
  if (programs.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        title="لا توجد برامج منشورة"
        description="البرامج المنشورة أو الجارية ستظهر هنا مع عدد المتعلمين وتقدّمهم."
      />
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {programs.map((p) => (
        <li key={p.id} className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {canManageContent ? (
                <Link
                  href={`/admin/content/${p.slug}`}
                  className="block truncate text-sm font-bold text-foreground hover:text-gold"
                >
                  {p.title}
                </Link>
              ) : (
                <p className="truncate text-sm font-bold text-foreground">{p.title}</p>
              )}
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span>{seatsText(p)}</span>
                {p.startDate && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" aria-hidden />
                    <time dateTime={p.startDate}>يبدأ {formatShortDate(p.startDate)}</time>
                  </span>
                )}
              </p>
            </div>
            <Badge variant={p.status === 'ONGOING' ? 'success' : 'muted'}>{PROGRAM_STATUS_LABELS_AR[p.status]}</Badge>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">متوسط تقدّم المتعلمين النشطين</span>
              <bdi className="font-bold text-foreground tabular-nums">{formatPercent(p.averageProgressPct)}</bdi>
            </div>
            <Progress value={p.averageProgressPct} label={`متوسط تقدّم ${p.title}`} />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <Badge variant="muted">{formatNumber(p.active)} نشط</Badge>
            <Badge variant="muted">{formatNumber(p.completed)} أتمّ البرنامج</Badge>
            {p.pending > 0 &&
              (canReviewEnrollments ? (
                <Link href="/admin/enrollments">
                  <Badge variant="warning">
                    <ClipboardList /> {formatNumber(p.pending)} طلب بانتظار المراجعة
                  </Badge>
                </Link>
              ) : (
                <Badge variant="warning">
                  <ClipboardList /> {formatNumber(p.pending)} طلب بانتظار المراجعة
                </Badge>
              ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
