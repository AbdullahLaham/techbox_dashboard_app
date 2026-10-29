// hooks/use-enrollments.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '@/services/enrollment-service';
import { useAuthStore } from '@/store/use-auth-store';
import type {
  AdminEnrollmentListQuery,
  EnrollmentApplicationFields,
  UpdateEnrollmentStatusBody,
} from '@/types/api.contract';

export const enrollmentKeys = {
  mine: (userId: string | undefined) => ['my-enrollments', userId] as const,
  admin: ['admin-enrollments'] as const,
  adminList: (query: AdminEnrollmentListQuery) => [...enrollmentKeys.admin, 'list', query] as const,
  adminDetail: (id: string) => [...enrollmentKeys.admin, 'detail', id] as const,
};

/* --------------------------------- Learner -------------------------------- */

export function useMyEnrollments() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: enrollmentKeys.mine(userId),
    queryFn: enrollmentService.getMyEnrollments,
    enabled: !!userId,
  });
}

export function useApplyToProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ programId, fields, receipt }: { programId: string; fields: EnrollmentApplicationFields; receipt?: File | null }) =>
      enrollmentService.apply(programId, fields, receipt),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['program'] }),
        qc.invalidateQueries({ queryKey: ['programs'] }),
        qc.invalidateQueries({ queryKey: ['my-enrollments'] }),
      ]),
  });
}

/* ---------------------------------- Admin --------------------------------- */

export function useAdminEnrollments(query: AdminEnrollmentListQuery) {
  return useQuery({
    queryKey: enrollmentKeys.adminList(query),
    queryFn: ({ signal }) => enrollmentService.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAdminEnrollment(id: string | null) {
  return useQuery({
    queryKey: enrollmentKeys.adminDetail(id ?? ''),
    queryFn: ({ signal }) => enrollmentService.get(id as string, signal),
    enabled: !!id,
    // The receipt link is signed for about an hour; refresh before it expires.
    staleTime: 1000 * 60 * 30,
  });
}

export function useChangeEnrollmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateEnrollmentStatusBody }) => enrollmentService.changeStatus(id, body),
    onSuccess: (detail) => {
      qc.setQueryData(enrollmentKeys.adminDetail(detail.id), detail);
      return Promise.all([
        qc.invalidateQueries({ queryKey: [...enrollmentKeys.admin, 'list'] }),
        // Seats and learner counts shown on the program screens change too.
        qc.invalidateQueries({ queryKey: ['admin-programs'] }),
        qc.invalidateQueries({ queryKey: ['programs'] }),
      ]);
    },
  });
}
