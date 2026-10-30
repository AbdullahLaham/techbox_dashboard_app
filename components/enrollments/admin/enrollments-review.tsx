// components/enrollments/admin/enrollments-review.tsx
'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Paperclip, Search, UserCheck } from 'lucide-react';
import { useAdminEnrollments } from '@/hooks/use-enrollments';
import { useAdminPrograms } from '@/hooks/use-programs';
import { DashboardError } from '@/components/dashboard/shared/dashboard-states';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatShortDate } from '@/lib/format';
import { EnrollmentStatusBadge } from './enrollment-status-badge';
import { EnrollmentReviewPanel } from './enrollment-review-panel';
import { EnrollmentProgress } from './enrollment-progress';
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS_AR,
  type AdminEnrollmentListQuery,
  type EnrollmentStatus,
} from '@/types/api.contract';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

interface EnrollmentsReviewProps {
  initialProgramId?: string;
  initialStatus: EnrollmentStatus;
}

export function EnrollmentsReview({ initialProgramId, initialStatus }: EnrollmentsReviewProps) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState<AdminEnrollmentListQuery>({
    page: 1,
    pageSize: PAGE_SIZE,
    status: initialStatus,
    programId: initialProgramId,
    sort: initialStatus === 'PENDING' ? 'createdAt' : '-createdAt', // oldest applications first in the review queue
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      const q = search.trim() || undefined;
      setQuery((prev) => (prev.q === q ? prev : { ...prev, q, page: 1 }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  const { data, isPending, isError, isFetching, refetch } = useAdminEnrollments(query);
  const programs = useAdminPrograms();

  const setFilter = (patch: Partial<AdminEnrollmentListQuery>) => setQuery((prev) => ({ ...prev, ...patch, page: 1 }));
  const page = query.page ?? 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
          <UserCheck className="h-3.5 w-3.5" /> القبول والتسجيل
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">طلبات التسجيل</h1>
        <p className="text-sm text-muted-foreground">راجع بيانات المتقدمين وإيصالات الدفع، ثم اقبل الطلب أو ارفضه مع ملاحظة تظهر للطالب.</p>
      </div>

      {/* تبويبات الحالة مع العدد */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="حالة الطلب">
        {ENROLLMENT_STATUSES.map((s) => {
          const active = query.status === s;
          return (
            <button
              key={s}
              role="tab"
              aria-selected={active}
              onClick={() => setFilter({ status: s, sort: s === 'PENDING' ? 'createdAt' : '-createdAt' })}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                active ? 'border-gold bg-gold/15 text-foreground' : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {ENROLLMENT_STATUS_LABELS_AR[s]}
              <span className="rounded-full bg-muted px-1.5 text-[10px]">{formatNumber(data?.statusCounts[s] ?? 0)}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-3">
        <div className="relative sm:col-span-2">
          <Search className="absolute top-2.5 right-3.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            aria-label="بحث"
            placeholder="ابحث بالاسم أو البريد أو الهاتف أو رقم الهوية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-background py-2 pr-10 pl-4 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
          />
        </div>
        <select
          aria-label="البرنامج"
          value={query.programId ?? ''}
          onChange={(e) => setFilter({ programId: e.target.value || undefined })}
          className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
        >
          <option value="">كل البرامج</option>
          {programs.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <div className="space-y-2 rounded-2xl border bg-card p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : isError ? (
        <DashboardError onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">لا توجد طلبات بهذه الحالة.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">المتقدم</th>
                <th className="p-4 font-semibold">البرنامج</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">التقدّم</th>
                <th className="p-4 font-semibold">تاريخ التقديم</th>
                <th className="p-4 font-semibold">الإيصال</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                >
                  <td className="p-4">
                    <div className="font-bold text-foreground">
                      {item.user.fullNameAr || [item.user.firstName, item.user.lastName].filter(Boolean).join(' ') || item.user.email}
                    </div>
                    <div className="text-xs text-muted-foreground" dir="ltr">
                      {item.user.email}
                    </div>
                  </td>
                  <td className="p-4 text-xs">{item.program.title}</td>
                  <td className="p-4">
                    <EnrollmentStatusBadge status={item.status} />
                  </td>
                  <td className="p-4">
                    <EnrollmentProgress enrollment={item} compact />
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{formatShortDate(item.createdAt)}</td>
                  <td className="p-4 text-xs">
                    {item.hasReceipt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <Paperclip className="h-3.5 w-3.5" /> مرفق
                      </span>
                    ) : (
                      <span className="text-muted-foreground">لا يوجد</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            {formatNumber(data.total)} طلب
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setQuery((prev) => ({ ...prev, page: page - 1 }))}
              aria-label="الصفحة السابقة"
              className="rounded-lg border p-1.5 hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span>
              {formatNumber(page)} / {formatNumber(totalPages)}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setQuery((prev) => ({ ...prev, page: page + 1 }))}
              aria-label="الصفحة التالية"
              className="rounded-lg border p-1.5 hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <EnrollmentReviewPanel enrollmentId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
