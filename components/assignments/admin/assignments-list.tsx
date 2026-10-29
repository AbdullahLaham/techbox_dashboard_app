// components/assignments/admin/assignments-list.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ClipboardList, Loader2, Plus, Search } from 'lucide-react';
import { DashboardError } from '@/components/dashboard/shared/dashboard-states';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentsTable } from '@/components/assignments/admin/assignments-table';
import { useAdminAssignments, useAssignmentTargets } from '@/hooks/use-admin-assignments';
import { ASSIGNMENT_STATUS_LABELS } from '@/lib/labels';
import { formatNumber } from '@/lib/format';
import type {
  AdminAssignmentListQuery,
  AdminAssignmentSort,
  AssignmentStatus,
} from '@/types/assignments.admin.contract';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

const SORT_OPTIONS: { value: AdminAssignmentSort; label: string }[] = [
  { value: '-createdAt', label: 'الأحدث إنشاءً' },
  { value: 'createdAt', label: 'الأقدم إنشاءً' },
  { value: 'dueDate', label: 'الموعد النهائي (الأقرب)' },
  { value: '-dueDate', label: 'الموعد النهائي (الأبعد)' },
  { value: '-publishedAt', label: 'الأحدث نشراً' },
  { value: 'title', label: 'العنوان (أ-ي)' },
  { value: '-title', label: 'العنوان (ي-أ)' },
];

const STATUSES: AssignmentStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

const selectClass =
  'w-full rounded-xl border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-gold focus:outline-none disabled:opacity-50';

export function AdminAssignmentsList() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState<AdminAssignmentListQuery>({ page: 1, pageSize: PAGE_SIZE, sort: '-createdAt' });

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery((prev) => (prev.q === (search.trim() || undefined) ? prev : { ...prev, q: search.trim() || undefined, page: 1 }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  const { data, isPending, isError, isFetching, refetch } = useAdminAssignments(query);
  const targets = useAssignmentTargets();

  const programs = targets.data?.programs ?? [];
  const tracks = programs.find((p) => p.id === query.programId)?.tracks ?? [];
  const modules = tracks.find((t) => t.id === query.trackId)?.modules ?? [];

  /** Changing a filter resets to page 1; changing a parent level clears its children. */
  const setFilter = (patch: Partial<AdminAssignmentListQuery>) => setQuery((prev) => ({ ...prev, ...patch, page: 1 }));

  const hasFilters = !!(query.q || query.programId || query.trackId || query.moduleId || query.status);
  const page = query.page ?? 1;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            <ClipboardList className="h-3.5 w-3.5" /> الواجبات والمهام
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">إدارة الواجبات</h1>
          <p className="text-sm text-muted-foreground">أنشئ الواجبات، أرفق ملفات التعليمات، وتحكّم بما يراه الطلاب.</p>
        </div>
        <Link
          href="/admin/assignments/new"
          className="flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3 text-sm font-bold text-navy-900 shadow-md transition-all hover:bg-gold/90"
        >
          <Plus className="h-4 w-4" /> واجب جديد
        </Link>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search className="absolute top-2.5 right-3.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            aria-label="بحث"
            placeholder="ابحث بعنوان الواجب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-background py-2 pr-10 pl-4 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
          />
        </div>
        <select
          aria-label="البرنامج"
          className={selectClass}
          value={query.programId ?? ''}
          onChange={(e) => setFilter({ programId: e.target.value || undefined, trackId: undefined, moduleId: undefined })}
        >
          <option value="">كل البرامج</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <select
          aria-label="المسار"
          className={selectClass}
          value={query.trackId ?? ''}
          disabled={!query.programId}
          onChange={(e) => setFilter({ trackId: e.target.value || undefined, moduleId: undefined })}
        >
          <option value="">كل المسارات</option>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <select
          aria-label="الوحدة"
          className={selectClass}
          value={query.moduleId ?? ''}
          disabled={!query.trackId}
          onChange={(e) => setFilter({ moduleId: e.target.value || undefined })}
        >
          <option value="">كل الوحدات</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <select
          aria-label="الحالة"
          className={selectClass}
          value={query.status ?? ''}
          onChange={(e) => setFilter({ status: (e.target.value || undefined) as AssignmentStatus | undefined })}
        >
          <option value="">كل الحالات</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {ASSIGNMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          {data ? <>إجمالي النتائج: <span className="font-bold text-foreground tabular-nums">{formatNumber(data.total)}</span></> : ' '}
          {isFetching && !isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" aria-label="جارٍ التحديث" />}
        </p>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          الترتيب
          <select
            className="rounded-xl border bg-background px-3 py-1.5 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
            value={query.sort}
            onChange={(e) => setFilter({ sort: e.target.value as AdminAssignmentSort })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="جارٍ تحميل الواجبات">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : isError && !data ? (
        <DashboardError onRetry={() => void refetch()} />
      ) : (
        <AssignmentsTable items={data?.items ?? []} isFetching={isFetching} hasFilters={hasFilters} />
      )}

      {data && data.total > data.pageSize && (
        <nav className="flex items-center justify-center gap-3" aria-label="التنقل بين الصفحات">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setQuery((prev) => ({ ...prev, page: page - 1 }))}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> السابق
          </button>
          <span className="text-xs text-muted-foreground tabular-nums">
            صفحة {formatNumber(page)} من {formatNumber(totalPages)}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setQuery((prev) => ({ ...prev, page: page + 1 }))}
            className="inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
          >
            التالي <ChevronLeft className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden />
          </button>
        </nav>
      )}
    </div>
  );
}
