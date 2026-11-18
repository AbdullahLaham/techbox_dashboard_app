// components/dashboard/learner/upcoming-deadlines.tsx
import Link from 'next/link';
import { AlertCircle, CalendarCheck, Clock, Hourglass, PenLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/dashboard/shared/dashboard-states';
import type { HomeUpcomingAssignment } from '@/types/home.contract';
import { daysUntil, formatNumber, formatRelative, formatShortDate } from '@/lib/format';

function AssignmentBadge({ item, now }: { item: HomeUpcomingAssignment; now: number }) {
  if (item.isOverdue) {
    return (
      <Badge variant="danger">
        <AlertCircle /> متأخر
      </Badge>
    );
  }
  if (item.state === 'NEEDS_REVISION') {
    return (
      <Badge variant="warning">
        <PenLine /> مطلوب تعديل
      </Badge>
    );
  }
  if (item.dueDate && daysUntil(item.dueDate, now) <= 1) {
    return (
      <Badge variant="warning">
        <Hourglass /> عاجل
      </Badge>
    );
  }
  return (
    <Badge variant="muted">
      <Clock /> لم يُسلَّم
    </Badge>
  );
}

interface UpcomingAssignmentsProps {
  /** Nearest deadline first, at most 3 (GET /v1/home → assignments.upcoming). */
  items: readonly HomeUpcomingAssignment[];
  /** All assignments still to hand in, which can be more than `items`. */
  todoCount: number;
  now: number;
}

/** Assignments the learner still has to hand in, with their deadline. */
export function UpcomingAssignments({ items, todoCount, now }: UpcomingAssignmentsProps) {
  if (items.length === 0) {
    return <EmptyState icon={CalendarCheck} title="لا واجبات بانتظار التسليم" description="أنت على اطلاع بكل شيء." />;
  }

  return (
    <div className="space-y-2">
      <ul className="divide-y rounded-2xl border bg-card shadow-sm">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/assignments/${item.id}`}
              className="flex items-start justify-between gap-3 p-4 transition-colors outline-none hover:bg-muted/30 focus-visible:bg-muted/40"
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-bold text-foreground">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">{item.program.title}</p>
                <p className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-gold">
                  <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                  {item.dueDate ? (
                    <time dateTime={item.dueDate}>
                      {formatShortDate(item.dueDate)} · {formatRelative(item.dueDate, now)}
                    </time>
                  ) : (
                    <span>بدون موعد نهائي</span>
                  )}
                </p>
              </div>
              <AssignmentBadge item={item} now={now} />
            </Link>
          </li>
        ))}
      </ul>
      {todoCount > items.length && (
        <p className="text-xs text-muted-foreground">
          و<bdi className="font-bold tabular-nums">{formatNumber(todoCount - items.length)}</bdi> واجبات أخرى في صفحة الواجبات.
        </p>
      )}
    </div>
  );
}
