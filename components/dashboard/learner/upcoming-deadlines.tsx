// components/dashboard/learner/upcoming-deadlines.tsx
import Link from 'next/link';
import { AlertCircle, CalendarCheck, CheckCircle2, Clock, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { DeadlineStatus, type UpcomingDeadline } from '@/types/dashboard';
import { NODE_TYPE_LABELS } from '@/lib/labels';
import { daysUntil, formatRelative, formatShortDate } from '@/lib/format';

function DeadlineBadge({ deadline, now }: { deadline: UpcomingDeadline; now: number }) {
  if (deadline.status === DeadlineStatus.SUBMITTED) {
    return (
      <Badge variant="success">
        <CheckCircle2 /> تم التسليم
      </Badge>
    );
  }
  const days = daysUntil(deadline.dueAt, now);
  if (days < 0) {
    return (
      <Badge variant="danger">
        <AlertCircle /> متأخر
      </Badge>
    );
  }
  if (days <= 1) {
    return (
      <Badge variant="warning">
        <Hourglass /> عاجل
      </Badge>
    );
  }
  return (
    <Badge variant="muted">
      <Clock /> {deadline.status === DeadlineStatus.IN_PROGRESS ? 'قيد الإنجاز' : 'لم يبدأ'}
    </Badge>
  );
}

interface UpcomingDeadlinesProps {
  deadlines: readonly UpcomingDeadline[];
  now: number;
}

export function UpcomingDeadlines({ deadlines, now }: UpcomingDeadlinesProps) {
  if (deadlines.length === 0) {
    return <EmptyState icon={CalendarCheck} title="لا توجد مواعيد قادمة" description="أنت على اطلاع بكل شيء." />;
  }

  const sorted = [...deadlines].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return (
    <ul className="divide-y rounded-2xl border bg-card shadow-sm">
      {sorted.map((deadline) => (
        <li key={deadline.id}>
          <Link
            href={`/programs/${deadline.programSlug}`}
            className="flex items-start justify-between gap-3 p-4 transition-colors outline-none hover:bg-muted/30 focus-visible:bg-muted/40"
          >
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-bold text-foreground">{deadline.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {NODE_TYPE_LABELS[deadline.type]} · {deadline.programTitle}
              </p>
              <p className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-gold">
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
                <time dateTime={deadline.dueAt}>
                  {formatShortDate(deadline.dueAt)} · {formatRelative(deadline.dueAt, now)}
                </time>
              </p>
            </div>
            <DeadlineBadge deadline={deadline} now={now} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
