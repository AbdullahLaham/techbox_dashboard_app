// hooks/use-admin-assignments.ts  (admin hooks, assignments.spec.md §19.7)
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentsAdminApi, type AssignmentRequestError } from '@/services/assignments-admin-service';
import type {
  AdminAssignmentDetail,
  AdminAssignmentListQuery,
  AdminAttachment,
  AssignmentStatus,
  CreateAssignmentBody,
  UpdateAssignmentBody,
} from '@/types/assignments.admin.contract';

export const adminAssignmentKeys = {
  all: ['admin-assignments'] as const,
  lists: () => [...adminAssignmentKeys.all, 'list'] as const,
  list: (query: AdminAssignmentListQuery) => [...adminAssignmentKeys.lists(), query] as const,
  detail: (id: string) => [...adminAssignmentKeys.all, 'detail', id] as const,
  targets: () => [...adminAssignmentKeys.all, 'targets'] as const,
};

/* ---------------------------------- Reads --------------------------------- */

/** Table data. Keeps the previous page on screen while the next one loads. */
export function useAdminAssignments(query: AdminAssignmentListQuery, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: adminAssignmentKeys.list(query),
    queryFn: ({ signal }) => assignmentsAdminApi.list(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAdminAssignment(id: string | undefined) {
  return useQuery({
    queryKey: adminAssignmentKeys.detail(id ?? ''),
    queryFn: ({ signal }) => assignmentsAdminApi.get(id as string, signal),
    enabled: Boolean(id),
  });
}

/** Programs > tracks > modules. Rarely changes, so it is cached for 5 minutes. */
export function useAssignmentTargets() {
  return useQuery({
    queryKey: adminAssignmentKeys.targets(),
    queryFn: ({ signal }) => assignmentsAdminApi.getTargets(signal),
    staleTime: 5 * 60 * 1000,
  });
}

/* --------------------------------- Writes --------------------------------- */

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation<AdminAssignmentDetail, AssignmentRequestError, CreateAssignmentBody>({
    mutationFn: (body) => assignmentsAdminApi.create(body),
    onSuccess: (created) => {
      queryClient.setQueryData(adminAssignmentKeys.detail(created.id), created);
      return queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.lists() });
    },
  });
}

export function useUpdateAssignment(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminAssignmentDetail, AssignmentRequestError, UpdateAssignmentBody>({
    mutationFn: (body) => assignmentsAdminApi.update(id, body),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminAssignmentKeys.detail(id), updated);
      return queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.lists() });
    },
  });
}

/** Publish, unpublish, archive or restore. Variable: the new status. */
export function useChangeAssignmentStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminAssignmentDetail, AssignmentRequestError, AssignmentStatus>({
    mutationFn: (status) => assignmentsAdminApi.changeStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminAssignmentKeys.detail(id), updated);
      return queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.lists() });
    },
  });
}

/** Variable: the assignment id (so one hook instance can serve every table row). */
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation<void, AssignmentRequestError, string>({
    mutationFn: (id) => assignmentsAdminApi.remove(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: adminAssignmentKeys.detail(id) });
      return queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.lists() });
    },
  });
}

/* ------------------------------- Attachments ------------------------------ */

type UploadVariables = {
  assignmentId: string;
  file: File;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation<AdminAttachment, AssignmentRequestError, UploadVariables>({
    mutationFn: ({ assignmentId, file, onProgress, signal }) =>
      assignmentsAdminApi.uploadAttachment(assignmentId, file, { onProgress, signal }),
    onSuccess: (_attachment, { assignmentId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.detail(assignmentId) }),
        queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.lists() }), // attachmentsCount
      ]),
  });
}

export function useDeleteAttachment(assignmentId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, AssignmentRequestError, string>({
    mutationFn: (attachmentId) => assignmentsAdminApi.deleteAttachment(assignmentId, attachmentId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.detail(assignmentId) }),
        queryClient.invalidateQueries({ queryKey: adminAssignmentKeys.lists() }),
      ]),
  });
}
