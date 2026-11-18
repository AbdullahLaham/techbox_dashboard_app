// components/dashboard/learner/weekly-activity-card.tsx
import { CalendarCheck } from 'lucide-react';
import type { HomeWeeklyActivity, Weekday } from '@/types/home.contract';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS: Record<Weekday, string> = {
  SAT: 'السبت',
  SUN: 'الأحد',
  MON: 'الاثنين',
  TUE: 'الثلاثاء',
  WED: 'الأربعاء',
  THU: 'الخميس',
  FRI: 'الجمعة',
};

/**
 * This week, Saturday to Friday: a day is active when the learner studied a lesson, handed in an
 * assignment or took a quiz (GET /v1/home → weeklyActivity).
 */
export function WeeklyActivityCard({ activity }: { activity: HomeWeeklyActivity }) {
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gold/10 p-2.5 text-gold">
          <CalendarCheck className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-foreground tabular-nums">
            <bdi>{formatNumber(activity.activeDaysCount)}</bdi>
            <span className="text-sm font-semibold text-muted-foreground"> / 7</span>
          </p>
          <p className="text-[11px] text-muted-foreground">أيام تعلّمت فيها هذا الأسبوع</p>
        </div>
      </div>

      <ul className="grid grid-cols-7 gap-1.5" aria-label="نشاط أيام هذا الأسبوع">
        {activity.days.map((day) => {
          const name = WEEKDAY_LABELS[day.weekday];
          const state = day.isActive ? 'نشِط' : day.isFuture ? 'لم يأتِ بعد' : 'بدون نشاط';
          return (
            <li key={day.date} className="flex flex-col items-center gap-1.5" title={`${name}: ${state}`}>
              <span className="sr-only">
                {name}
                {day.isToday ? ' (اليوم)' : ''}: {state}
              </span>
              <span
                aria-hidden
                className={cn(
                  'h-8 w-full max-w-8 rounded-lg border',
                  day.isActive && 'border-gold bg-gold',
                  !day.isActive && !day.isFuture && 'border-border bg-secondary',
                  day.isFuture && 'border-dashed border-border bg-transparent',
                  day.isToday && 'ring-2 ring-gold/40 ring-offset-1 ring-offset-card',
                )}
              />
              <span
                aria-hidden
                className={cn('text-[10px]', day.isToday ? 'font-bold text-foreground' : 'text-muted-foreground')}
              >
                {name.replace('ال', '')}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
