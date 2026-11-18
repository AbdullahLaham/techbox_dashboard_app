// components/dashboard/learner/learner-overview.tsx
'use client';

import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import { useLearnerHome } from '@/hooks/use-dashboard';
import { useMyEnrollments } from '@/hooks/use-enrollments';
import { useSession } from '@/hooks/use-session';
import { KpiCard } from '@/components/dashboard/shared/kpi-card';
import { Section } from '@/components/dashboard/shared/section';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/shared/dashboard-states';
import type { KpiMetric } from '@/types/dashboard';
import type { HomeResponse } from '@/types/home.contract';
import { formatNumber } from '@/lib/format';
import { WelcomeBanner } from './welcome-banner';
import { WeeklyActivityCard } from './weekly-activity-card';
import { EnrolledPrograms } from './enrolled-programs';
import { UpcomingAssignments } from './upcoming-deadlines';

/** Every number comes from GET /v1/home, the same feed as the mobile Home tab. */
function buildLearnerKpis(home: HomeResponse): KpiMetric[] {
  const { stats, assignments, weeklyActivity } = home;
  return [
    {
      id: 'programs',
      label: 'البرامج النشطة',
      value: stats.activePrograms,
      format: 'number',
      deltaLabel: `${formatNumber(stats.completedPrograms)} برنامج مكتمل`,
    },
    {
      id: 'pending',
      label: 'واجبات بانتظار التسليم',
      value: assignments.todoCount,
      format: 'number',
      deltaLabel:
        assignments.overdueCount > 0 ? `${formatNumber(assignments.overdueCount)} منها متأخر` : 'لا واجبات متأخرة',
      higherIsBetter: false,
    },
    {
      id: 'lessons',
      label: 'الدروس المكتملة',
      value: stats.completedLessons,
      format: 'number',
      deltaLabel: `من أصل ${formatNumber(stats.totalLessons)} درساً إلزامياً`,
    },
    {
      id: 'activity',
      label: 'أيام التعلّم هذا الأسبوع',
      value: weeklyActivity.activeDaysCount,
      format: 'number',
      deltaLabel: 'من 7 أيام',
    },
  ];
}

const KPI_ICONS = {
  programs: GraduationCap,
  pending: Clock,
  lessons: CheckCircle2,
  activity: CalendarCheck,
} as const;

export function LearnerOverview() {
  const home = useLearnerHome();
  const enrollments = useMyEnrollments();
  const { user } = useSession();
  // Frozen per mount so greetings, relative dates and urgency badges stay consistent.
  const [now] = useState(() => Date.now());

  if (home.isPending || enrollments.isPending) return <DashboardSkeleton />;
  if (home.isError || enrollments.isError) {
    return (
      <DashboardError
        onRetry={() => {
          if (home.isError) void home.refetch();
          if (enrollments.isError) void enrollments.refetch();
        }}
      />
    );
  }

  const data = home.data;

  return (
    <div className="space-y-8 pb-10">
      <WelcomeBanner
        firstName={user?.firstName}
        activeDaysThisWeek={data.weeklyActivity.activeDaysCount}
        continueLearning={data.continueLearning}
        now={now}
      />

      <section aria-label="ملخص التقدّم" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {buildLearnerKpis(data).map((metric) => (
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
          <Section title="نشاطي هذا الأسبوع">
            <WeeklyActivityCard activity={data.weeklyActivity} />
          </Section>
          <Section title="واجبات بانتظار التسليم" action={{ label: 'كل الواجبات', href: '/assignments' }}>
            <UpcomingAssignments items={data.assignments.upcoming} todoCount={data.assignments.todoCount} now={now} />
          </Section>
        </div>
      </div>
    </div>
  );
}
