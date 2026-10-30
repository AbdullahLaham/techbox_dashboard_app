// hooks/use-notifications.ts
// The header bell: unread count, the notification list and marking them read.
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/notifications-service';
import { useAuthStore } from '@/store/use-auth-store';
import type { NotificationList } from '@/types/api.contract';

export const notificationKeys = {
  all: (userId: string | undefined) => ['notifications', userId] as const,
  unread: (userId: string | undefined) => [...notificationKeys.all(userId), 'unread-count'] as const,
  lists: (userId: string | undefined) => [...notificationKeys.all(userId), 'list'] as const,
  list: (userId: string | undefined, unreadOnly: boolean) => [...notificationKeys.lists(userId), { unreadOnly }] as const,
};

const PAGE_SIZE = 20;
/** No push yet: the badge also refreshes every few minutes while the tab is visible. */
const UNREAD_POLL_MS = 3 * 60 * 1000;

type ListPages = InfiniteData<NotificationList, number>;

/** Badge count. Refreshed on load, on window focus and every few minutes. */
export function useUnreadNotificationsCount() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: notificationKeys.unread(userId),
    queryFn: ({ signal }) => notificationsApi.unreadCount(signal),
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: UNREAD_POLL_MS,
  });
}

/** Newest first, page by page. Only fetched while the list is shown (`enabled`). */
export function useNotifications(unreadOnly: boolean, enabled: boolean) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useInfiniteQuery({
    queryKey: notificationKeys.list(userId, unreadOnly),
    queryFn: async ({ pageParam, signal }) => {
      const page = await notificationsApi.list({ page: pageParam, pageSize: PAGE_SIZE, unreadOnly }, signal);
      // Every page carries the user's total unread count: keep the badge in step.
      qc.setQueryData(notificationKeys.unread(userId), page.unreadCount);
      return page;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    enabled: enabled && !!userId,
    // Opening the bell always shows fresh notifications.
    staleTime: 0,
  });
}

/** Applies `change` to every cached notification page and returns the previous caches for rollback. */
function updateCachedLists(qc: QueryClient, userId: string | undefined, change: (list: NotificationList) => NotificationList) {
  const previous = qc.getQueriesData<ListPages>({ queryKey: notificationKeys.lists(userId) });
  qc.setQueriesData<ListPages>({ queryKey: notificationKeys.lists(userId) }, (old) =>
    old ? { ...old, pages: old.pages.map(change) } : old,
  );
  return previous;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    // Optimistic: the item reads as opened right away, before the app navigates.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: notificationKeys.all(userId) });
      const previousCount = qc.getQueryData<number>(notificationKeys.unread(userId));
      const previousLists = updateCachedLists(qc, userId, (list) => ({
        ...list,
        items: list.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      }));
      if (previousCount !== undefined) qc.setQueryData(notificationKeys.unread(userId), Math.max(0, previousCount - 1));
      return { previousCount, previousLists };
    },
    onError: (_error, _id, context) => {
      context?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data));
      if (context?.previousCount !== undefined) qc.setQueryData(notificationKeys.unread(userId), context.previousCount);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.unread(userId) }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      updateCachedLists(qc, userId, (list) => ({ ...list, unreadCount: 0, items: list.items.map((n) => ({ ...n, isRead: true })) }));
      qc.setQueryData(notificationKeys.unread(userId), 0);
      // The "unread only" tab is now empty.
      return qc.invalidateQueries({ queryKey: notificationKeys.list(userId, true) });
    },
  });
}
