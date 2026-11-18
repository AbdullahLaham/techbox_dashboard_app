// services/dashboard-service.ts
import { apiClient } from '@/services/auth-service';
import { localTimeZone } from '@/lib/assignment-format';
import { ADMIN_OVERVIEW_ENDPOINT, type AdminOverviewResponse } from '@/types/admin-overview.contract';
import { HOME_ENDPOINT, type HomeResponse } from '@/types/home.contract';

function browserTimeZone(): string | undefined {
  try {
    return localTimeZone() || undefined;
  } catch {
    return undefined;
  }
}

/** The two home pages. Every number is counted by the API; nothing is generated here. */
export const dashboardService = {
  /** Staff home page. */
  async getAdminOverview(): Promise<AdminOverviewResponse> {
    const res = await apiClient.get<AdminOverviewResponse>(ADMIN_OVERVIEW_ENDPOINT);
    return res.data;
  },

  /** Learner home page: the same feed as the mobile Home tab, with weekdays in the viewer's timezone. */
  async getLearnerHome(): Promise<HomeResponse> {
    const tz = browserTimeZone();
    const res = await apiClient.get<HomeResponse>(HOME_ENDPOINT, { params: tz ? { tz } : undefined });
    return res.data;
  },
};
