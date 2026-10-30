// components/users/admin/users-directory.tsx
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search, UserPlus, Users } from 'lucide-react';
import { DashboardError } from '@/components/dashboard/shared/dashboard-states';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/layout/user-avatar';
import { useAdminUsers } from '@/hooks/use-admin-users';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSession } from '@/hooks/use-session';
import { formatDateTime } from '@/lib/assignment-format';
import { formatNumber, formatRelative, formatShortDate } from '@/lib/format';
import { assignableRoles } from '@/lib/users';
import { cn } from '@/lib/utils';
import {
  GLOBAL_ROLES,
  ROLE_LABELS_AR,
  USER_STATUS_LABELS_AR,
  type AdminUserListItem,
  type AdminUserSort,
  type GlobalRole,
  type UserStatus,
} from '@/types/api.contract';
import { CreateUserDialog } from './create-user-dialog';
import { UserPanel } from './user-panel';
import { RoleBadge, UserStatusBadge } from './user-parts';

const PAGE_SIZE = 20;
const USER_STATUSES: readonly UserStatus[] = ['ACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED'];

const SORTS: ReadonlyArray<{ value: AdminUserSort; label: string }> = [
  { value: '-createdAt', label: 'الأحدث إنشاءً' },
  { value: 'createdAt', label: 'الأقدم إنشاءً' },
  { value: '-lastSeenAt', label: 'آخر ظهور' },
  { value: 'email', label: 'البريد (أ-ي)' },
];

function initialsOf(user: AdminUserListItem): string {
  return (user.displayName.trim()[0] ?? user.email[0] ?? '؟').toUpperCase();
}

export function UsersDirectory() {
  const { user: me, role: myRole } = useSession();
  const creatableRoles = assignableRoles(myRole);

  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search.trim()) || undefined;
  const [role, setRole] = useState<GlobalRole | undefined>();
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [sort, setSort] = useState<AdminUserSort>('-createdAt');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // A new search or filter starts again from the first page.
  const [filterKey, setFilterKey] = useState(`${q}|${role}|${status}|${sort}`);
  const currentKey = `${q}|${role}|${status}|${sort}`;
  if (filterKey !== currentKey) {
    setFilterKey(currentKey);
    setPage(1);
  }

  const { data, isPending, isError, isFetching, refetch } = useAdminUsers({ page, pageSize: PAGE_SIZE, q, role, status, sort });
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const allCount = data ? GLOBAL_ROLES.reduce((sum, r) => sum + data.roleCounts[r], 0) : 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            <Users className="h-3.5 w-3.5" /> إدارة المستخدمين
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">المستخدمون والصلاحيات</h1>
          <p className="text-sm text-muted-foreground">أنشئ حسابات الفريق، وغيّر الأدوار، وأوقف الحسابات أو أعد تعيين كلمات المرور.</p>
        </div>
        {creatableRoles.length > 0 && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90"
          >
            <UserPlus className="h-4 w-4" /> إضافة مستخدم
          </button>
        )}
      </div>

      {/* تبويبات الدور مع العدد (تتبع البحث وتتجاهل فلتر الدور والحالة) */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="الدور">
        {[undefined, ...GLOBAL_ROLES].map((r) => {
          const active = role === r;
          return (
            <button
              key={r ?? 'all'}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(r)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all',
                active ? 'border-gold bg-gold/15 text-foreground' : 'bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              {r ? ROLE_LABELS_AR[r] : 'الكل'}
              <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">{formatNumber(r ? (data?.roleCounts[r] ?? 0) : allCount)}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute top-2.5 right-3.5 h-4 w-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            aria-label="بحث"
            placeholder="ابحث بالاسم أو البريد أو الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-background py-2 pr-10 pl-4 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
          />
        </div>
        <select
          aria-label="الحالة"
          value={status ?? ''}
          onChange={(e) => setStatus((e.target.value || undefined) as UserStatus | undefined)}
          className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
        >
          <option value="">كل الحالات</option>
          {USER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {USER_STATUS_LABELS_AR[s]} ({formatNumber(data?.statusCounts[s] ?? 0)})
            </option>
          ))}
        </select>
        <select
          aria-label="الترتيب"
          value={sort}
          onChange={(e) => setSort(e.target.value as AdminUserSort)}
          className="w-full rounded-xl border bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-gold focus:outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {isPending ? (
        <div className="space-y-2 rounded-2xl border bg-card p-4" role="status" aria-label="جارٍ تحميل المستخدمين">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError && !data ? (
        <DashboardError onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
          {q || role || status ? 'لا يوجد مستخدمون مطابقون.' : 'لا يوجد مستخدمون بعد.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="p-4 font-semibold">المستخدم</th>
                <th className="p-4 font-semibold">الدور</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">آخر ظهور</th>
                <th className="p-4 font-semibold">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn('cursor-pointer transition-colors hover:bg-muted/30', item.status === 'ARCHIVED' && 'opacity-60')}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar initials={initialsOf(item)} src={item.avatarUrl ?? undefined} alt={item.displayName} />
                      <div className="min-w-0">
                        {/* A real button keeps rows reachable by keyboard. */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(item.id);
                          }}
                          className="block max-w-[16rem] truncate text-right font-bold text-foreground hover:underline"
                        >
                          {item.displayName}
                          {item.id === me?.id && <span className="ms-1.5 text-[10px] font-semibold text-gold">(أنت)</span>}
                        </button>
                        <div className="max-w-[16rem] truncate text-xs text-muted-foreground" dir="ltr" style={{ textAlign: 'right' }}>
                          {item.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <RoleBadge role={item.globalRole} />
                  </td>
                  <td className="p-4">
                    <UserStatusBadge status={item.status} />
                  </td>
                  <td className="p-4 text-xs text-muted-foreground" title={item.lastSeenAt ? formatDateTime(item.lastSeenAt) : undefined}>
                    {item.lastSeenAt ? formatRelative(item.lastSeenAt) : 'لم يسجّل الدخول'}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{formatShortDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            {formatNumber(data.total)} مستخدم
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              aria-label="الصفحة السابقة"
              className="rounded-lg border p-1.5 hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span>
              {formatNumber(page)} / {formatNumber(totalPages)}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              aria-label="الصفحة التالية"
              className="rounded-lg border p-1.5 hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <UserPanel userId={selectedId} onClose={() => setSelectedId(null)} />
      <CreateUserDialog
        open={creating}
        roles={creatableRoles}
        onClose={() => setCreating(false)}
        onOpenUser={(id) => {
          setCreating(false);
          setSelectedId(id);
        }}
      />
    </div>
  );
}
