// components/assignments/admin/assignments-table.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Paperclip } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/shared/dashboard-states';
import { AssignmentStatusBadge } from '@/components/assignments/admin/assignment-status-badge';
import { AssignmentActions } from '@/components/assignments/admin/assignment-actions';
import { formatDateTime } from '@/lib/assignment-format';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AdminAssignmentListItem } from '@/types/assignments.admin.contract';

interface AssignmentsTableProps {
  items: readonly AdminAssignmentListItem[];
  /** True while a new page/filter loads with the previous rows still on screen. */
  isFetching: boolean;
  hasFilters: boolean;
}

export function AssignmentsTable({ items, isFetching, hasFilters }: AssignmentsTableProps) {
  const [now] = useState(() => Date.now());

  if (items.length === 0) {
    return hasFilters ? (
      <EmptyState icon={ClipboardList} title="لا توجد نتائج" description="لا يوجد واجب يطابق عوامل التصفية الحالية." />
    ) : (
      <EmptyState icon={ClipboardList} title="لا توجد واجبات بعد" description="أنشئ أول واجب وأرفق ملفات التعليمات ثم انشره للطلاب.">
        <Link
          href="/admin/assignments/new"
          className="rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy-900 shadow-sm hover:bg-gold/90"
        >
          إنشاء واجب
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-2xl border bg-card shadow-sm transition-opacity', isFetching && 'opacity-60')}>
      <table className="w-full min-w-[900px] text-right text-xs">
        <thead className="border-b bg-muted/40 text-[11px] font-semibold text-muted-foreground">
          <tr>
            <th className="px-4 py-3">الواجب</th>
            <th className="px-4 py-3">البرنامج</th>
            <th className="px-4 py-3">الحالة</th>
            <th className="px-4 py-3">الموعد النهائي</th>
            <th className="px-4 py-3 text-center">التسليمات</th>
            <th className="px-4 py-3 text-center">بانتظار التقييم</th>
            <th className="px-4 py-3 text-center">المرفقات</th>
            <th className="px-4 py-3">
              <span className="sr-only">إجراءات</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => {
            const pastDue = item.dueDate && new Date(item.dueDate).getTime() < now;
            return (
              <tr key={item.id} className="transition-colors hover:bg-muted/30">
                <td className="max-w-[260px] px-4 py-3">
                  <Link href={`/admin/assignments/${item.id}`} className="block truncate font-bold text-foreground hover:text-gold">
                    {item.title}
                  </Link>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {item.track.title} · {item.module.title}
                  </span>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">{item.program.title}</td>
                <td className="px-4 py-3">
                  <AssignmentStatusBadge status={item.status} />
                </td>
                <td className={cn('px-4 py-3 whitespace-nowrap', pastDue ? 'text-destructive' : 'text-muted-foreground')}>
                  {item.dueDate ? formatDateTime(item.dueDate) : '—'}
                </td>
                <td className="px-4 py-3 text-center font-semibold tabular-nums">{formatNumber(item.submissionsCount)}</td>
                <td className="px-4 py-3 text-center tabular-nums">
                  <span
                    className={cn(
                      'inline-block min-w-7 rounded-full px-2 py-0.5 font-bold',
                      item.pendingReviewCount > 0 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'text-muted-foreground',
                    )}
                  >
                    {formatNumber(item.pendingReviewCount)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="h-3 w-3" aria-hidden /> {formatNumber(item.attachmentsCount)}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <AssignmentActions assignment={item} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
