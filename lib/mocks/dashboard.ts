// lib/mocks/dashboard.ts
// Fixtures for the dashboard endpoints until the backend ships them. Timestamps are
// generated relative to "now" so relative labels ("منذ ساعتين", "غداً") stay meaningful.
import { NodeType } from '@/types/program';
import {
  DeadlineStatus,
  StartupStage,
  type AdminOverview,
  type LearnerOverview,
} from '@/types/dashboard';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const at = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

export function buildAdminOverviewMock(): AdminOverview {
  return {
    kpis: [
      { id: 'learners', label: 'إجمالي المتعلمين', value: 412, format: 'number', delta: 12, deltaLabel: 'هذا الشهر' },
      { id: 'startups', label: 'المشاريع المحتضنة النشطة', value: 28, format: 'number', delta: 4, deltaLabel: 'مشاريع جديدة' },
      {
        id: 'pending-reviews',
        label: 'تسليمات بانتظار التقييم',
        value: 14,
        format: 'number',
        delta: 3,
        deltaLabel: 'منذ الأمس',
        higherIsBetter: false,
      },
      { id: 'completion', label: 'متوسط تقدّم الدفعات', value: 78.2, format: 'percent', delta: 2.4, deltaLabel: 'عن الأسبوع الماضي' },
    ],
    pipeline: [
      { stage: StartupStage.IDEATION, count: 11 },
      { stage: StartupStage.VALIDATION, count: 8 },
      { stage: StartupStage.MVP, count: 6 },
      { stage: StartupStage.GROWTH, count: 2 },
      { stage: StartupStage.INVESTMENT_READY, count: 1 },
    ],
    cohorts: [
      { id: 'c3', name: 'الدفعة الثالثة — التقنيات المالية', progress: 85, activeStartups: 12, atRiskStartups: 1 },
      { id: 'c4', name: 'الدفعة الرابعة — الذكاء الاصطناعي', progress: 62, activeStartups: 10, atRiskStartups: 3 },
      { id: 'c5', name: 'الدفعة الخامسة — التقنيات الزراعية', progress: 34, activeStartups: 6, atRiskStartups: 0 },
    ],
    mentorUtilization: 72,
  };
}

export function buildLearnerOverviewMock(): LearnerOverview {
  const weeklyMinutes = [45, 80, 20, 0, 95, 60, 35];
  return {
    activity: {
      rate: 94,
      previousRate: 88,
      streakDays: 6,
      weekly: weeklyMinutes.map((minutes, i) => ({ date: at(-(weeklyMinutes.length - 1 - i) * DAY), minutes })),
    },
    deadlines: [
      {
        id: 'd1',
        title: 'نموذج التوقعات المالية v1',
        programTitle: 'تقييم الشركات الناشئة',
        programSlug: 'startup-valuation',
        type: NodeType.ASSIGNMENT,
        dueAt: at(20 * HOUR),
        status: DeadlineStatus.IN_PROGRESS,
      },
      {
        id: 'd2',
        title: 'جلسة متابعة مع الموجّه',
        programTitle: 'برنامج الاحتضان',
        programSlug: 'startup-valuation',
        type: NodeType.MENTORSHIP_CHECKIN,
        dueAt: at(2 * DAY + 4 * HOUR),
        status: DeadlineStatus.NOT_STARTED,
      },
      {
        id: 'd3',
        title: 'مخطط قاعدة البيانات ERD',
        programTitle: 'هندسة Next.js و NestJS',
        programSlug: 'fullstack-architecture',
        type: NodeType.ASSIGNMENT,
        dueAt: at(5 * DAY),
        status: DeadlineStatus.SUBMITTED,
      },
      {
        id: 'd4',
        title: 'اختبار الوحدة الرابعة',
        programTitle: 'هندسة Next.js و NestJS',
        programSlug: 'fullstack-architecture',
        type: NodeType.QUIZ,
        dueAt: at(8 * DAY),
        status: DeadlineStatus.NOT_STARTED,
      },
    ],
    startup: {
      name: 'منصة التشخيص الطبي الذكي',
      stage: StartupStage.MVP,
      nextMentorSessionAt: at(2 * DAY + 4 * HOUR),
    },
  };
}
