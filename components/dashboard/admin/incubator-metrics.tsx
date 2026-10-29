// components/dashboard/admin/incubator-metrics.tsx
import { AlertTriangle, CheckCircle2, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CohortHealth, StageCount } from '@/types/dashboard';
import { STARTUP_STAGE_LABELS } from '@/lib/labels';
import { formatNumber, formatPercent } from '@/lib/format';

/**
 * Startup pipeline by stage. Single series → one hue (gold), no legend; every bar is
 * direct-labeled with its count and carries a hover tooltip + accessible label.
 */
export function StartupPipeline({ stages }: { stages: readonly StageCount[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-foreground">خط سير المشاريع حسب المرحلة</h3>
        <span className="text-xs text-muted-foreground">
          الإجمالي <bdi className="font-bold text-foreground tabular-nums">{formatNumber(total)}</bdi>
        </span>
      </div>

      <ul className="space-y-3">
        {stages.map(({ stage, count }) => {
          const label = STARTUP_STAGE_LABELS[stage];
          const share = total ? Math.round((count / total) * 100) : 0;
          return (
            <li
              key={stage}
              className="group grid grid-cols-[7.5rem_1fr_2rem] items-center gap-3 rounded-lg py-0.5 text-xs"
              title={`${label}: ${count} مشروع (${share}%)`}
            >
              <span className="truncate font-medium text-muted-foreground group-hover:text-foreground">{label}</span>
              {/* Track is recessive; the bar is anchored to the inline-start baseline */}
              <div className="h-2.5 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`${label}: ${count} مشروع`}>
                <div
                  className="h-full rounded-full bg-gold transition-[width,opacity] duration-700 group-hover:opacity-80"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="text-end font-bold text-foreground tabular-nums">{formatNumber(count)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CohortHealthList({ cohorts }: { cohorts: readonly CohortHealth[] }) {
  return (
    <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-bold text-foreground">صحة الدفعات</h3>
      <ul className="space-y-4">
        {cohorts.map((cohort) => (
          <li key={cohort.id} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-semibold text-foreground">{cohort.name}</span>
              <bdi className="shrink-0 font-bold text-foreground tabular-nums">{formatPercent(cohort.progress)}</bdi>
            </div>
            <Progress value={cohort.progress} label={`تقدّم ${cohort.name}`} />
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{formatNumber(cohort.activeStartups)} مشروع نشط</span>
              {cohort.atRiskStartups > 0 ? (
                <Badge variant="warning">
                  <AlertTriangle /> {formatNumber(cohort.atRiskStartups)} بحاجة لمتابعة
                </Badge>
              ) : (
                <Badge variant="success">
                  <CheckCircle2 /> على المسار
                </Badge>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MentorUtilization({ value }: { value: number }) {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gold/10 p-2.5 text-gold">
          <UserCheck className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">إشغال الموجّهين</h3>
          <p className="text-[11px] text-muted-foreground">نسبة الساعات المحجوزة من السعة الشهرية</p>
        </div>
      </div>
      <p className="text-2xl font-extrabold text-foreground tabular-nums">
        <bdi>{formatPercent(value)}</bdi>
      </p>
      <Progress value={value} label="إشغال الموجّهين" />
    </div>
  );
}
