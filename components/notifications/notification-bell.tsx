// components/notifications/notification-bell.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popover } from '@base-ui/react/popover';
import {
  Award,
  Bell,
  BellOff,
  CheckCheck,
  ClipboardList,
  Clock,
  Info,
  Loader2,
  Megaphone,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationsCount,
} from '@/hooks/use-notifications';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatNumber, formatRelative } from '@/lib/format';
import { notificationHref } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import type { AppNotification, NotificationType } from '@/types/api.contract';

const TYPE_ICONS: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  GRADED: { icon: Award, className: 'bg-gold/15 text-gold' },
  ENROLLMENT: { icon: UserCheck, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  NEW_ASSIGNMENT: { icon: ClipboardList, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  ASSIGNMENT_DUE: { icon: Clock, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  ANNOUNCEMENT: { icon: Megaphone, className: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  SYSTEM: { icon: Info, className: 'bg-muted text-muted-foreground' },
};

function badgeText(count: number): string {
  return count > 99 ? '99+' : formatNumber(count);
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadNotificationsCount();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={unread > 0 ? `الإشعارات، ${unread} غير مقروءة` : 'الإشعارات'}
        className="relative rounded-2xl border border-border bg-background p-2.5 text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground data-[popup-open]:border-gold/50 data-[popup-open]:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span
            className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy-900 tabular-nums ring-2 ring-card"
            aria-hidden
          >
            {badgeText(unread)}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8} collisionPadding={12} className="z-50">
          <Popover.Popup
            dir="rtl"
            className="flex max-h-[min(36rem,calc(100vh-6rem))] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border bg-card text-right shadow-xl outline-none"
          >
            {/* Rendered only while open, so the list is fetched when the bell is opened. */}
            <NotificationPanel unread={unread} onNavigate={() => setOpen(false)} />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function NotificationPanel({ unread, onNavigate }: { unread: number; onNavigate: () => void }) {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotifications(unreadOnly, true);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const open = (notification: AppNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    const href = notificationHref(notification.actionUrl);
    if (href) {
      onNavigate();
      router.push(href);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <Popover.Title className="text-sm font-bold text-foreground">الإشعارات</Popover.Title>
        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={unread === 0 || markAll.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-gold hover:bg-gold/10 disabled:pointer-events-none disabled:opacity-40"
        >
          {markAll.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
          تعليم الكل كمقروء
        </button>
      </div>

      <div className="flex gap-1.5 border-b px-4 py-2" role="tablist" aria-label="عرض الإشعارات">
        {[
          { value: false, label: 'الكل' },
          { value: true, label: `غير المقروءة${unread > 0 ? ` (${badgeText(unread)})` : ''}` },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={unreadOnly === tab.value}
            onClick={() => setUnreadOnly(tab.value)}
            className={cn(
              'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors',
              unreadOnly === tab.value ? 'bg-gold/15 text-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {markAll.error && (
        <p role="alert" className="border-b bg-destructive/10 px-4 py-2 text-[11px] text-destructive">
          {getApiErrorMessage(markAll.error, 'تعذّر تعليم الإشعارات كمقروءة.')}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending ? (
          <div className="space-y-2 p-4" role="status" aria-label="جارٍ تحميل الإشعارات">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="space-y-2 p-6 text-center text-xs text-destructive">
            <p>تعذّر تحميل الإشعارات.</p>
            <button type="button" onClick={() => void refetch()} className="font-semibold underline">
              إعادة المحاولة
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-8 text-center">
            <BellOff className="h-8 w-8 text-muted-foreground/60" aria-hidden />
            <p className="text-xs text-muted-foreground">{unreadOnly ? 'لا توجد إشعارات غير مقروءة.' : 'لا توجد إشعارات بعد.'}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id}>
                <NotificationItem notification={n} onOpen={() => open(n)} />
              </li>
            ))}
          </ul>
        )}

        {hasNextPage && (
          <div className="border-t p-2">
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold text-gold hover:bg-gold/10 disabled:opacity-60"
            >
              {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              عرض المزيد
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function NotificationItem({ notification, onOpen }: { notification: AppNotification; onOpen: () => void }) {
  const { icon: Icon, className: iconClass } = TYPE_ICONS[notification.type] ?? TYPE_ICONS.SYSTEM;
  const linked = notificationHref(notification.actionUrl) !== null;
  // Read notifications without a page to open have nothing left to do.
  const interactive = linked || !notification.isRead;

  const body = (
    <>
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', iconClass)}>
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className={cn('block text-xs text-foreground', notification.isRead ? 'font-medium' : 'font-bold')}>{notification.title}</span>
        <span className="line-clamp-2 block text-[11px] leading-relaxed text-muted-foreground">{notification.message}</span>
        <span className="block text-[10px] text-muted-foreground/80">{formatRelative(notification.createdAt)}</span>
      </span>
      {!notification.isRead && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold">
          <span className="sr-only">غير مقروء</span>
        </span>
      )}
    </>
  );

  const className = cn('flex w-full items-start gap-3 px-4 py-3 text-right', !notification.isRead && 'bg-gold/5');

  return interactive ? (
    <button type="button" onClick={onOpen} className={cn(className, 'transition-colors hover:bg-muted/50')}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
