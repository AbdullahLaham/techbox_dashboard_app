// hooks/use-dashboard.ts
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard-service';
import { useAuthStore } from '@/store/use-auth-store';

export const dashboardKeys = {
  admin: ['dashboard', 'admin'] as const,
  // Scoped per user so switching accounts never shows the previous learner's data.
  learner: (userId: string | undefined) => ['dashboard', 'learner', userId] as const,
};

export function useAdminOverview() {
  return useQuery({
    queryKey: dashboardKeys.admin,
    queryFn: dashboardService.getAdminOverview,
    staleTime: 1000 * 60,
  });
}

export function useLearnerOverview() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: dashboardKeys.learner(userId),
    queryFn: dashboardService.getLearnerOverview,
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}
