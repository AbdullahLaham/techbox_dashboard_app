// components/dashboard/learner/learner-overview.tsx
'use client';

import { useState } from 'react';
import { Activity, CheckCircle2, Clock, GraduationCap } from 'lucide-react';
import { useLearnerOverview } from '@/hooks/use-dashboard';
import { useSession } from '@/hooks/use-session';
import { KpiCard } from '@/components/dashboard/shared/kpi-card';
import { Section } from '@/components/dashboard/shared/section';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/shared/dashboard-states';
import { DeadlineStatus, type KpiMetric, type LearnerOverview as LearnerOverviewData } from '@/types/dashboard';
import { daysUntil } from '@/lib/format';
import { WelcomeBanner } from './welcome-banner';
import { ActivityRateCard } from './activity-rate-card';
import { EnrolledPrograms } from './enrolled-programs';
import { UpcomingDeadlines } from './upcoming-deadlines';

function buildLearnerKpis(data: LearnerOverviewData, now: number): KpiMetric[] {
  const active = data.programs.filter((p) => p.progress < 100).length;
  const completedLessons = data.programs.reduce((sum, p) => sum + p.completedLessons, 0);
  const open = data.deadlines.filter((d) => d.status !== DeadlineStatus.SUBMITTED);
  const dueThisWeek = open.filter((d) => daysUntil(d.dueAt, now) <= 7).length;

  return [
    { id: 'programs', label: 'البرامج النشطة', value: active, format: 'number', delta: data.programs.length - active, deltaLabel: 'برنامج مكتمل' },
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
  const { data, isPending, isError, refetch } = useLearnerOverview();
  const { user } = useSession();
  // Frozen per mount so greetings, relative dates and urgency badges stay consistent.
  const [now] = useState(() => Date.now());

  if (isPending) return <DashboardSkeleton />;
  if (isError) return <DashboardError onRetry={() => void refetch()} />;

  const kpis = buildLearnerKpis(data, now);

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
          <EnrolledPrograms programs={data.programs} />
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
