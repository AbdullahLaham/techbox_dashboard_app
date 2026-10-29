// components/dashboard/shared/kpi-card.tsx
import type { LucideIcon } from 'lucide-react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { KpiMetric } from '@/types/dashboard';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

function formatValue(metric: KpiMetric): string {
  return metric.format === 'percent' ? formatPercent(metric.value, 1) : formatNumber(metric.value);
}

function formatDelta(delta: number, format: KpiMetric['format']): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const magnitude = Math.abs(delta);
  return format === 'percent' ? `${sign}${magnitude.toFixed(1)} نقطة` : `${sign}${formatNumber(magnitude)}`;
}

function DeltaPill({ delta, metric }: { delta: number; metric: KpiMetric }) {
  const higherIsBetter = metric.higherIsBetter ?? true;
  const direction = delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const isGood = direction === 'flat' ? null : (direction === 'up') === higherIsBetter;
  const TrendIcon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-bold tabular-nums',
        isGood === null && 'bg-muted text-muted-foreground',
        isGood === true && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        isGood === false && 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      )}
    >
      <TrendIcon className="h-3 w-3" aria-hidden />
      <bdi>{formatDelta(delta, metric.format)}</bdi>
    </span>
  );
}

export function KpiCard({ metric, icon: Icon }: { metric: KpiMetric; icon: LucideIcon }) {

  return (
    <article className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gold/10 p-2.5 text-gold">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="text-xs font-semibold text-muted-foreground">{metric.label}</h3>
      </div>

      <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
        <bdi>{formatValue(metric)}</bdi>
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {metric.delta !== undefined && <DeltaPill delta={metric.delta} metric={metric} />}
        <span>{metric.deltaLabel}</span>
      </p>
    </article>
  );
}
