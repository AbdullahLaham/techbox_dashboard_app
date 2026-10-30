// components/dashboard/learner/learner-overview.tsx
'use client';

import { useState } from 'react';
import { Activity, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import { useLearnerOverview } from '@/hooks/use-dashboard';
import { useMyEnrollments } from '@/hooks/use-enrollments';
import { useSession } from '@/hooks/use-session';
import { KpiCard } from '@/components/dashboard/shared/kpi-card';
import { Section } from '@/components/dashboard/shared/section';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/shared/dashboard-states';
import { DeadlineStatus, type KpiMetric, type LearnerOverview as LearnerOverviewData } from '@/types/dashboard';
import { daysUntil } from '@/lib/format';
import { WelcomeBanner } from './welcome-banner';
import { ActivityRateCard } from './activity-rate-card';
import { EnrolledPrograms, isEnrollmentFinished } from './enrolled-programs';
import type { MyEnrollment } from '@/types/api.contract';
import { UpcomingDeadlines } from './upcoming-deadlines';

/** Programs and lessons come from the learner's enrollments; deadlines and activity are still fixtures. */
function buildLearnerKpis(data: LearnerOverviewData, enrollments: readonly MyEnrollment[], now: number): KpiMetric[] {
  const withAccess = enrollments.filter((e) => e.status === 'ACTIVE' || e.status === 'COMPLETED');
  const finished = withAccess.filter(isEnrollmentFinished).length;
  const active = withAccess.length - finished;
  const completedLessons = withAccess.reduce((sum, e) => sum + e.completedLessons, 0);
  const open = data.deadlines.filter((d) => d.status !== DeadlineStatus.SUBMITTED);
  const dueThisWeek = open.filter((d) => daysUntil(d.dueAt, now) <= 7).length;

  return [
    { id: 'programs', label: 'البرامج النشطة', value: active, format: 'number', delta: finished, deltaLabel: 'برنامج مكتمل' },
    { id: 'pending', label: 'مهام بانتظار التسليم', value: open.length, format: 'number', delta: dueThisWeek, deltaLabel: 'تستحق هذا الأسبوع', higherIsBetter: false },
    { id: 'lessons', label: 'الدروس المكتملة', value: completedLessons, format: 'number', deltaLabel: 'عبر جميع البرامج' },
    { id: 'activity', label: 'معدل النشاط', value: data.activity.rate, format: 'percent', delta: data.activity.rate - data.activity.previousRate, deltaLabel: 'عن الشهر الماضي' },
  ];
}

const KPI_ICONS = {
  programs: GraduationCap,
  pending: Clock,
  lessons: CheckCircle2,
  activity: Activity,
} as const;

export function LearnerOverview() {
  const overview = useLearnerOverview();
  const enrollments = useMyEnrollments();
  const { user } = useSession();
  // Frozen per mount so greetings, relative dates and urgency badges stay consistent.
  const [now] = useState(() => Date.now());

  if (overview.isPending || enrollments.isPending) return <DashboardSkeleton />;
  if (overview.isError || enrollments.isError) {
    return (
      <DashboardError
        onRetry={() => {
          if (overview.isError) void overview.refetch();
          if (enrollments.isError) void enrollments.refetch();
        }}
      />
    );
  }

  const data = overview.data;
  const kpis = buildLearnerKpis(data, enrollments.data, now);

  return (
    <div className="space-y-8 pb-10">
      <WelcomeBanner firstName={user?.firstName} activityRate={data.activity.rate} startup={data.startup} now={now} />

      <section aria-label="ملخص التقدّم" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} icon={KPI_ICONS[metric.id as keyof typeof KPI_ICONS]} />
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <Section
          title="برامجي المسجّلة"
          description="تابع من حيث توقفت."
          action={{ label: 'كل البرامج', href: '/programs' }}
          className="lg:col-span-2"
        >
          <EnrolledPrograms enrollments={enrollments.data} />
        </Section>

        <div className="space-y-8">
          <Section title="معدل النشاط">
            <ActivityRateCard activity={data.activity} />
          </Section>
          <Section title="المواعيد النهائية القادمة">
            <UpcomingDeadlines deadlines={data.deadlines} now={now} />
          </Section>
        </div>
      </div>
    </div>
  );
}
