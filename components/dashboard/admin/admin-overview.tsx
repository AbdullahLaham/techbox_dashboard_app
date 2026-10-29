// components/dashboard/admin/admin-overview.tsx
'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { FileCheck, Rocket, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useAdminOverview } from '@/hooks/use-dashboard';
import { usePendingReviews } from '@/hooks/use-submissions';
import { useSession } from '@/hooks/use-session';
import { getQuickActions } from '@/config/navigation';
import { canAccessRoute } from '@/lib/auth/rbac';
import { HeroBanner } from '@/components/dashboard/shared/hero-banner';
import { KpiCard } from '@/components/dashboard/shared/kpi-card';
import { Section } from '@/components/dashboard/shared/section';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/shared/dashboard-states';
import { GradingQueuePreview, GradingQueueSummary } from './grading-queue-preview';
import { CohortHealthList, MentorUtilization, StartupPipeline } from './incubator-metrics';
import { QuickActions } from './quick-actions';

const KPI_ICONS: Record<string, LucideIcon> = {
  learners: Users,
  startups: Rocket,
  'pending-reviews': FileCheck,
  completion: TrendingUp,
};

export function AdminOverview() {
  const { data, isPending, isError, refetch } = useAdminOverview();
  const { user, role, roleLabel } = useSession();
  const canReview = canAccessRoute('/admin/grading', role);
  const pending = usePendingReviews(canReview);

  if (isPending) return <DashboardSkeleton />;
  if (isError) return <DashboardError onRetry={() => void refetch()} />;

  const quickActions = getQuickActions(role);

  return (
    <div className="space-y-8 pb-10">
      <HeroBanner
        eyebrow={`مركز قيادة الحاضنة · ${roleLabel}`}
        eyebrowIcon={ShieldCheck}
        title={<>مرحباً {user?.firstName ?? ''}، إليك نظرة شاملة على المنصة</>}
        description="تابع تقدّم الدفعات، راجع مراحل المشاريع الناشئة، وقيّم التسليمات المعلّقة لحظياً."
        aside={
          canReview &&
          pending.total > 0 && (
            <Link
              href="/admin/grading"
              className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy-900 shadow-lg transition-colors hover:bg-gold/90"
            >
              <FileCheck className="h-4 w-4" /> ابدأ التقييم
              <span className="rounded-full bg-navy-900 px-2 py-0.5 text-[10px] text-gold tabular-nums">
                {pending.total}
              </span>
            </Link>
          )
        }
      />

      <section aria-label="المؤشرات الرئيسية" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} icon={KPI_ICONS[metric.id] ?? TrendingUp} />
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        {canReview && (
          <Section
            title="معاينة قائمة التقييم"
            description="الواجبات التي تنتظر تسليماتها التقييم، الأكثر تسليمات أولاً."
            action={{ label: 'عرض القائمة كاملة', href: '/admin/grading' }}
            className="lg:col-span-2"
          >
            <GradingQueuePreview
              items={pending.items}
              isPending={pending.isPending}
              isError={pending.isError}
              onRetry={() => void pending.refetch()}
            />
            <GradingQueueSummary total={pending.total} assignments={pending.items.length} />
          </Section>
        )}

        {quickActions.length > 0 && (
          <Section title="إجراءات سريعة" description="اختصارات حسب صلاحياتك.">
            <QuickActions actions={quickActions} />
          </Section>
        )}
      </div>

      <Section title="مؤشرات الحاضنة" description="خط سير المشاريع، صحة الدفعات، وسعة الإرشاد.">
        <div className="grid gap-6 lg:grid-cols-3">
          <StartupPipeline stages={data.pipeline} />
          <CohortHealthList cohorts={data.cohorts} />
          <MentorUtilization value={data.mentorUtilization} />
        </div>
      </Section>
    </div>
  );
}
