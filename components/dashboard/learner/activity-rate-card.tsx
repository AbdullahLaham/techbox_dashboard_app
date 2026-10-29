// components/dashboard/learner/activity-rate-card.tsx
import { Flame } from 'lucide-react';
import type { ActivitySummary } from '@/types/dashboard';
import { clampPercent, formatNumber, formatPercent, formatWeekday } from '@/lib/format';

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ActivityRing({ value }: { value: number }) {
  const pct = clampPercent(value);
  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`معدل النشاط ${formatPercent(pct)}`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={RING_RADIUS} fill="none" strokeWidth="10" className="stroke-secondary" />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-gold transition-[stroke-dashoffset] duration-700"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - pct / 100)}
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center">
        <bdi className="text-2xl font-extrabold text-foreground tabular-nums">{formatPercent(pct)}</bdi>
        <span className="text-[10px] text-muted-foreground">معدل النشاط</span>
      </div>
    </div>
  );
}

/**
 * Monthly activity rate (ring) + last 7 days of learning minutes. Single series → one
 * hue, no legend; each day has a hover tooltip and an accessible label.
 */
export function ActivityRateCard({ activity }: { activity: ActivitySummary }) {
  const change = activity.rate - activity.previousRate;
  const maxMinutes = Math.max(1, ...activity.weekly.map((d) => d.minutes));
  const totalMinutes = activity.weekly.reduce((sum, d) => sum + d.minutes, 0);

  return (
    <div className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-5">
        <ActivityRing value={activity.rate} />
        <div className="space-y-2 text-xs">
          <p className="text-muted-foreground">
            {change >= 0 ? 'أعلى' : 'أقل'} بـ{' '}
            <bdi className="font-bold text-foreground tabular-nums">{Math.abs(change).toFixed(0)} نقاط</bdi> من الشهر الماضي
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 font-bold text-gold">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            سلسلة {formatNumber(activity.streakDays)} أيام متتالية
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <h3 className="font-bold text-foreground">دقائق التعلّم — آخر 7 أيام</h3>
          <bdi className="text-muted-foreground tabular-nums">{formatNumber(totalMinutes)} دقيقة</bdi>
        </div>
        <ul className="flex h-28 gap-2" aria-label="دقائق التعلّم اليومية">
          {activity.weekly.map((day) => {
            const label = `${formatWeekday(day.date)}: ${day.minutes} دقيقة`;
            return (
              <li key={day.date} className="group flex flex-1 flex-col items-center gap-1" title={label}>
                <span className="sr-only">{label}</span>
                {/* Plot area: bars grow up from a shared baseline; the label sits below it */}
                <div aria-hidden className="flex w-full flex-1 items-end justify-center">
                  <div
                    className={
                      day.minutes > 0
                        ? 'w-full max-w-6 rounded-t-[4px] bg-gold transition-opacity group-hover:opacity-80'
                        : 'h-0.5 w-full max-w-6 rounded-full bg-border'
                    }
                    style={day.minutes > 0 ? { height: `${(day.minutes / maxMinutes) * 100}%` } : undefined}
                  />
                </div>
                <span aria-hidden className="text-[10px] text-muted-foreground">
                  {formatWeekday(day.date)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
