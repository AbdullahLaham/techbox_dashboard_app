// hooks/use-assignments.ts  (student hooks, assignments.spec.md §19.5)
import { useQuery } from '@tanstack/react-query';
import { assignmentsApi, isAssignmentNotFound } from '@/services/assignments-service';

export const assignmentKeys = {
  all: ['assignments'] as const,
  list: () => [...assignmentKeys.all, 'list'] as const,
  detail: (id: string) => [...assignmentKeys.all, 'detail', id] as const,
};

/** Signed file URLs last about an hour, so refresh the detail well before they expire. */
const ATTACHMENT_URL_REFRESH_MS = 45 * 60 * 1000;

/** The student's list. Derive tabs and counts with getAssignmentState / getAssignmentBucket. */
export function useAssignments() {
  return useQuery({
    queryKey: assignmentKeys.list(),
    queryFn: ({ signal }) => assignmentsApi.getMyAssignments(signal),
    staleTime: 30_000,
    // Web counterpart of the mobile app's useFocusEffect refetch (spec §10.1 M1); the app default is off.
    refetchOnWindowFocus: true,
  });
}

/** One assignment. On a 404 error (see isAssignmentNotFound) show "no longer available" and refetch the list. */
export function useAssignment(id: string | undefined) {
  return useQuery({
    queryKey: assignmentKeys.detail(id ?? ''),
    queryFn: ({ signal }) => assignmentsApi.getAssignment(id as string, signal),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount: number, error: unknown) => !isAssignmentNotFound(error) && failureCount < 2,
    refetchInterval: (query) => (query.state.data?.attachments.length ? ATTACHMENT_URL_REFRESH_MS : false),
  });
}
