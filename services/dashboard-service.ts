// services/dashboard-service.ts
import { apiClient } from '@/services/auth-service';
import { buildAdminOverviewMock, buildLearnerOverviewMock } from '@/lib/mocks/dashboard';
import type { AdminOverview, LearnerOverview } from '@/types/dashboard';

/**
 * The aggregate dashboard endpoints are not live on the backend yet. Until they are,
 * typed fixtures are served. Set NEXT_PUBLIC_DASHBOARD_MOCKS=false to hit the API.
 * The learner's programs and lesson progress are real already: they come from
 * GET /v1/enrollments/my-enrollments (useMyEnrollments), not from this overview.
 */
const USE_MOCKS = process.env.NEXT_PUBLIC_DASHBOARD_MOCKS !== 'false';

export const dashboardService = {
  async getAdminOverview(): Promise<AdminOverview> {
    if (USE_MOCKS) return buildAdminOverviewMock();
    const res = await apiClient.get<AdminOverview>('/dashboard/admin/overview');
    return res.data;
  },

  async getLearnerOverview(): Promise<LearnerOverview> {
    if (USE_MOCKS) return buildLearnerOverviewMock();
    const res = await apiClient.get<LearnerOverview>('/dashboard/me');
    return res.data;
  },
};
