// components/assignments/student/assignments-overview.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, ClipboardList, Inbox, Loader2, Sparkles } from 'lucide-react';
import { DashboardError, EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { HeroBanner } from '@/components/dashboard/shared/hero-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentCard } from '@/components/assignments/student/assignment-card';
import { useAssignments } from '@/hooks/use-assignments';
import { compareAssignments, findNextDue, formatDateTime } from '@/lib/assignment-format';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  getAssignmentBucket,
  getAssignmentState,
  type AssignmentBucket,
  type AssignmentItem,
} from '@/types/assignments.contract';

type TabId = 'ALL' | 'NEW' | AssignmentBucket;

const TABS: { id: TabId; label: string; empty: { title: string; description: string } }[] = [
  { id: 'ALL', label: 'الكل', empty: { title: 'لا توجد واجبات بعد', description: 'ستظهر هنا واجبات البرامج المسجّل فيها فور نشرها.' } },
  { id: 'NEW', label: 'جديدة', empty: { title: 'لا توجد واجبات جديدة', description: 'لا يوجد واجب نُشر مؤخراً بانتظارك.' } },
  { id: 'TODO', label: 'لم تُسلَّم', empty: { title: 'لا يوجد ما تسلّمه', description: 'أحسنت! سلّمت كل الواجبات المطلوبة.' } },
  { id: 'SUBMITTED', label: 'تم التسليم', empty: { title: 'لا توجد تسليمات قيد المراجعة', description: 'الواجبات التي تسلّمها ستظهر هنا حتى يتم تقييمها.' } },
  { id: 'DONE', label: 'مكتملة', empty: { title: 'لا توجد واجبات مكتملة', description: 'الواجبات التي تم تقييمها ستظهر هنا.' } },
];

function matchesTab(item: AssignmentItem, tab: TabId): boolean {
  if (tab === 'ALL') return true;
  if (tab === 'NEW') return item.isNew;
  return getAssignmentBucket(getAssignmentState(item)) === tab;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="جارٍ تحميل الواجبات">
      <Skeleton className="h-40 rounded-3xl" />
      <Skeleton className="h-11 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function NextDueCard({ item, now }: { item: AssignmentItem; now: number }) {
  return (
    <Link
      href={`/assignments/${item.id}`}
      className="block w-full max-w-xs space-y-1.5 rounded-2xl border border-gold/30 bg-white/5 p-4 backdrop-blur transition-colors hover:bg-white/10"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gold">
        <CalendarClock className="h-3.5 w-3.5" aria-hidden /> أقرب موعد تسليم
      </span>
      <p className="line-clamp-2 text-sm font-bold text-white">{item.title}</p>
      <p className="text-[11px] text-white/70">
        {formatRelative(item.dueDate as string, now)} · {formatDateTime(item.dueDate as string)}
      </p>
    </Link>
  );
}

export function AssignmentsOverview() {
  const { data, isPending, isError, isFetching, refetch } = useAssignments();
  const [tab, setTab] = useState<TabId>('ALL');
  const [now] = useState(() => Date.now());

  // Skeleton only on the very first load; background refetches keep the list on screen.
  if (isPending) return <OverviewSkeleton />;
  if (isError && !data) return <DashboardError onRetry={() => void refetch()} />;

  const items = [...data].sort(compareAssignments);
  const counts = Object.fromEntries(TABS.map((t) => [t.id, items.filter((i) => matchesTab(i, t.id)).length])) as Record<TabId, number>;
  const visible = items.filter((i) => matchesTab(i, tab));
  const nextDue = findNextDue(items, now);
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="space-y-6 pb-10">
      <HeroBanner
        eyebrow="واجباتي"
        eyebrowIcon={ClipboardList}
        title="الواجبات والمهام"
        description={
          counts.TODO > 0 ? (
            <>
              لديك <span className="font-bold text-gold">{counts.TODO}</span> واجب بانتظار التسليم
              {counts.NEW > 0 && <>، منها {counts.NEW} جديدة</>}.
            </>
          ) : (
            'لا توجد واجبات بانتظار التسليم حالياً.'
          )
        }
        aside={nextDue && <NextDueCard item={nextDue} now={now} />}
      />

      <div className="flex items-center gap-3">
        <div role="tablist" aria-label="تصفية الواجبات" className="flex flex-1 gap-1 overflow-x-auto rounded-2xl border bg-card p-1 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors',
                tab === t.id ? 'bg-navy-900 text-white dark:bg-gold dark:text-navy-900' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {t.id === 'NEW' && <Sparkles className="h-3.5 w-3.5" aria-hidden />}
              {t.label}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] tabular-nums',
                  tab === t.id ? 'bg-white/15 dark:bg-navy-900/15' : 'bg-muted',
                )}
              >
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
        {isFetching && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gold" aria-label="جارٍ التحديث" />}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={tab === 'DONE' || tab === 'TODO' ? CheckCircle2 : Inbox}
          title={activeTab.empty.title}
          description={activeTab.empty.description}
        />
      ) : (
        <div role="tabpanel" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <AssignmentCard key={item.id} item={item} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
