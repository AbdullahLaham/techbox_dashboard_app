// components/dashboard/admin/admin-overview.tsx
'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ClipboardList, FileCheck, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { useAdminOverview } from '@/hooks/use-dashboard';
import { usePendingReviews } from '@/hooks/use-submissions';
import { useSession } from '@/hooks/use-session';
import { getQuickActions } from '@/config/navigation';
import { canAccessRoute } from '@/lib/auth/rbac';
import { formatNumber } from '@/lib/format';
import { HeroBanner } from '@/components/dashboard/shared/hero-banner';
import { KpiCard } from '@/components/dashboard/shared/kpi-card';
import { Section } from '@/components/dashboard/shared/section';
import { DashboardError, DashboardSkeleton } from '@/components/dashboard/shared/dashboard-states';
import {
  ADMIN_OVERVIEW_NEW_LEARNER_DAYS,
  type AdminOverviewResponse,
} from '@/types/admin-overview.contract';
import type { KpiMetric } from '@/types/dashboard';
import { GradingQueuePreview, GradingQueueSummary } from './grading-queue-preview';
import { ProgramsOverview } from './programs-overview';
import { QuickActions } from './quick-actions';

const KPI_ICONS: Record<string, LucideIcon> = {
  learners: Users,
  applications: ClipboardList,
  'pending-reviews': FileCheck,
  progress: TrendingUp,
};

function buildAdminKpis(data: AdminOverviewResponse): KpiMetric[] {
  return [
    {
      id: 'learners',
      label: 'المتعلمون المسجّلون',
      value: data.learners.total,
      format: 'number',
      delta: data.learners.newRecently,
      deltaLabel: `انضموا خلال آخر ${ADMIN_OVERVIEW_NEW_LEARNER_DAYS} يوماً`,
    },
    {
      id: 'applications',
      label: 'طلبات تسجيل بانتظار المراجعة',
      value: data.pendingApplications,
      format: 'number',
      deltaLabel: 'طلبات لم يُتخذ فيها قرار بعد',
    },
    {
      id: 'pending-reviews',
      label: 'تسليمات بانتظار التقييم',
      value: data.submissionsAwaitingReview,
      format: 'number',
      deltaLabel: 'سلّمها الطلاب ولم تُقيَّم بعد',
    },
    {
      id: 'progress',
      label: 'متوسط تقدّم المتعلمين',
      value: data.enrollments.averageProgressPct,
      format: 'percent',
      deltaLabel: `${formatNumber(data.enrollments.active)} تسجيل نشط · ${formatNumber(data.enrollments.completed)} مكتمل`,
    },
  ];
}

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
        description="تابع طلبات التسجيل، تقدّم المتعلمين في البرامج، والتسليمات التي تنتظر التقييم."
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
        {buildAdminKpis(data).map((metric) => (
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

      <Section
        title="البرامج المنشورة والجارية"
        description="المتعلمون في كل برنامج، الطلبات المعلّقة، ومتوسط تقدّم المتعلمين النشطين."
      >
        <ProgramsOverview
          programs={data.programs}
          canManageContent={canAccessRoute('/admin/content', role)}
          canReviewEnrollments={canAccessRoute('/admin/enrollments', role)}
        />
      </Section>
    </div>
  );
}
