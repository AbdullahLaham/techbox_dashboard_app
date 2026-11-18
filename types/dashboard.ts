// types/dashboard.ts
// UI types shared by the dashboard home pages. The data itself comes from the API:
// staff home = GET /v1/admin/overview (types/admin-overview.contract.ts),
// learner home = GET /v1/home (types/home.contract.ts).

/** ISO-8601 timestamp string as returned by the API. */
export type IsoDateString = string;

export type MetricFormat = 'number' | 'percent';

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  format: MetricFormat;
  /**
   * Change vs. the previous period, in the metric's own unit (percentage points for percents).
   * Omit when there is no meaningful comparison; only `deltaLabel` is shown then.
   */
  delta?: number;
  deltaLabel: string;
  /** Set false for metrics where growth is bad (e.g. backlog size). Defaults to true. */
  higherIsBetter?: boolean;
}

/** Stages of an incubated startup. Used by the landing page; there is no startup data in the API yet. */
export enum StartupStage {
  IDEATION = 'IDEATION',
  VALIDATION = 'VALIDATION',
  MVP = 'MVP',
  GROWTH = 'GROWTH',
  INVESTMENT_READY = 'INVESTMENT_READY',
}
