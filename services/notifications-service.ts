// services/notifications-service.ts
// The signed-in user's in-app notifications (types/api.contract.ts, "Notifications").
import { apiClient } from '@/services/auth-service';
import {
  API_ENDPOINTS,
  type AppNotification,
  type NotificationList,
  type NotificationListQuery,
  type ReadAllResult,
  type UnreadCount,
} from '@/types/api.contract';

export const notificationsApi = {
  /** Newest first. `unreadCount` covers all of the user's notifications, not only this page. */
  async list(query: NotificationListQuery, signal?: AbortSignal): Promise<NotificationList> {
    const res = await apiClient.get<NotificationList>(API_ENDPOINTS.notifications, { params: query, signal });
    return res.data;
  },

  /** Cheap count for the bell badge. */
  async unreadCount(signal?: AbortSignal): Promise<number> {
    const res = await apiClient.get<UnreadCount>(API_ENDPOINTS.notificationsUnreadCount, { signal });
    return res.data.unreadCount;
  },

  async markRead(id: string): Promise<AppNotification> {
    const res = await apiClient.patch<AppNotification>(API_ENDPOINTS.notificationRead(id));
    return res.data;
  },

  async markAllRead(): Promise<ReadAllResult> {
    const res = await apiClient.post<ReadAllResult>(API_ENDPOINTS.notificationsReadAll);
    return res.data;
  },
};
