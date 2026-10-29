// hooks/use-submissions.ts
// Hand-ins: the student's attempts and submit form, and the reviewers' queue and grading.
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAssignmentKeys, useAdminAssignments } from '@/hooks/use-admin-assignments';
import { assignmentKeys } from '@/hooks/use-assignments';
import { submissionsAdminApi, submissionsApi, type SubmitOptions } from '@/services/submissions-service';
import type {
  AdminSubmissionListQuery,
  GradeSubmissionBody,
  SubmissionView,
  SubmitAssignmentBody,
} from '@/types/submissions.contract';

export const submissionKeys = {
  mine: (assignmentId: string) => ['my-submission', assignmentId] as const,
  admin: ['admin-submissions'] as const,
  lists: () => [...submissionKeys.admin, 'list'] as const,
  list: (assignmentId: string, query: AdminSubmissionListQuery) => [...submissionKeys.lists(), assignmentId, query] as const,
  detail: (submissionId: string) => [...submissionKeys.admin, 'detail', submissionId] as const,
};

/** Signed file URLs last about an hour, so refresh well before they expire. */
const FILE_URL_REFRESH_MS = 45 * 60 * 1000;

const hasFiles = (submissions: readonly SubmissionView[]) => submissions.some((s) => s.content.files.length > 0);

/* --------------------------------- Student -------------------------------- */

export function useMySubmission(assignmentId: string) {
  return useQuery({
    queryKey: submissionKeys.mine(assignmentId),
    queryFn: ({ signal }) => submissionsApi.getMySubmission(assignmentId, signal),
    enabled: !!assignmentId,
    // A reviewer may grade or ask for changes while the page is open.
    refetchOnWindowFocus: true,
    refetchInterval: (query) => (query.state.data && hasFiles(query.state.data.attempts) ? FILE_URL_REFRESH_MS : false),
  });
}

type SubmitVariables = SubmitOptions & { body: SubmitAssignmentBody; files: readonly File[] };

export function useSubmitAssignment(assignmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, files, ...options }: SubmitVariables) => submissionsApi.submit(assignmentId, body, files, options),
    onSettled: () =>
      // Also after SUBMISSION_LOCKED: the attempts changed elsewhere (another tab, the mobile app).
      Promise.all([
        qc.invalidateQueries({ queryKey: submissionKeys.mine(assignmentId) }),
        qc.invalidateQueries({ queryKey: assignmentKeys.all }),
      ]),
  });
}

/* -------------------------------- Reviewers ------------------------------- */

/** The API's maximum page size: the newest 100 assignments. */
export const GRADING_ASSIGNMENTS_QUERY = { pageSize: 100, sort: '-createdAt' } as const;

/**
 * Assignments with hand-ins waiting for a grader (SUBMITTED or UNDER_REVIEW), most first, and their
 * total. Shares its cache with the grading page's assignment list.
 */
export function usePendingReviews(enabled = true) {
  const query = useAdminAssignments(GRADING_ASSIGNMENTS_QUERY, { enabled });
  const items = (query.data?.items ?? [])
    .filter((a) => a.pendingReviewCount > 0)
    .sort((a, b) => b.pendingReviewCount - a.pendingReviewCount);
  const total = items.reduce((sum, a) => sum + a.pendingReviewCount, 0);
  return { ...query, items, total };
}

/** One assignment's queue. Keeps the previous page on screen while the next one loads. */
export function useAdminSubmissions(assignmentId: string | undefined, query: AdminSubmissionListQuery) {
  return useQuery({
    queryKey: submissionKeys.list(assignmentId ?? '', query),
    queryFn: ({ signal }) => submissionsAdminApi.list(assignmentId as string, query, signal),
    enabled: !!assignmentId,
    placeholderData: keepPreviousData,
  });
}

export function useAdminSubmission(submissionId: string) {
  return useQuery({
    queryKey: submissionKeys.detail(submissionId),
    queryFn: ({ signal }) => submissionsAdminApi.get(submissionId, signal),
    enabled: !!submissionId,
    refetchInterval: (query) => (query.state.data && hasFiles([query.state.data]) ? FILE_URL_REFRESH_MS : false),
  });
}

export function useGradeSubmission(submissionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: GradeSubmissionBody) => submissionsAdminApi.grade(submissionId, body),
    onSuccess: (submission) => {
      qc.setQueryData(submissionKeys.detail(submission.id), submission);
      return Promise.all([
        qc.invalidateQueries({ queryKey: submissionKeys.lists() }),
        qc.invalidateQueries({ queryKey: adminAssignmentKeys.lists() }), // pendingReviewCount
      ]);
    },
  });
}
