// types/dashboard.ts
import type { NodeType, ProgramType } from './program';

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

// ───────────────────────── Admin overview ─────────────────────────

export enum StartupStage {
  IDEATION = 'IDEATION',
  VALIDATION = 'VALIDATION',
  MVP = 'MVP',
  GROWTH = 'GROWTH',
  INVESTMENT_READY = 'INVESTMENT_READY',
}

export interface StageCount {
  stage: StartupStage;
  count: number;
}

export interface CohortHealth {
  id: string;
  name: string;
  /** 0–100 */
  progress: number;
  activeStartups: number;
  atRiskStartups: number;
}

export interface AdminOverview {
  kpis: KpiMetric[];
  pipeline: StageCount[];
  cohorts: CohortHealth[];
  /** 0–100: share of mentor capacity currently booked. */
  mentorUtilization: number;
}

// ───────────────────────── Learner overview ─────────────────────────

export interface DailyActivity {
  date: IsoDateString;
  minutes: number;
}

export interface ActivitySummary {
  /** 0–100: share of scheduled activities completed on time this month. */
  rate: number;
  previousRate: number;
  streakDays: number;
  weekly: DailyActivity[];
}

export interface EnrolledProgram {
  id: string;
  slug: string;
  title: string;
  type: ProgramType;
  instructorName: string;
  /** 0–100 */
  progress: number;
  completedLessons: number;
  totalLessons: number;
  nextLesson?: { title: string; type: NodeType };
}

export enum DeadlineStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  programTitle: string;
  programSlug: string;
  type: NodeType;
  dueAt: IsoDateString;
  status: DeadlineStatus;
}

export interface LearnerStartupSnapshot {
  name: string;
  stage: StartupStage;
  nextMentorSessionAt?: IsoDateString;
}

export interface LearnerOverview {
  activity: ActivitySummary;
  programs: EnrolledProgram[];
  deadlines: UpcomingDeadline[];
  startup?: LearnerStartupSnapshot;
}
