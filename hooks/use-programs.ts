// hooks/use-programs.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { programService } from '@/services/program-service';
import { useAuthStore } from '@/store/use-auth-store';
import type {
  AdminProgramListQuery,
  CreateModuleBody,
  CreateNodeBody,
  CreateProgramBody,
  CreateTrackBody,
  UpdateModuleBody,
  UpdateNodeBody,
  UpdateProgramBody,
  UpdateTrackBody,
} from '@/types/api.contract';

export const programKeys = {
  catalog: ['programs'] as const,
  // The detail depends on who asks (enrollment, locked lessons), so it is cached per user.
  detail: (slug: string, userId: string | undefined) => ['program', slug, userId ?? 'anonymous'] as const,
  admin: ['admin-programs'] as const,
  adminList: (query: AdminProgramListQuery) => [...programKeys.admin, 'list', query] as const,
  adminDetail: (idOrSlug: string) => [...programKeys.admin, 'detail', idOrSlug] as const,
};

/* --------------------------------- Learner -------------------------------- */

export function usePrograms() {
  return useQuery({
    queryKey: programKeys.catalog,
    queryFn: programService.getCatalog,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProgramDetail(slug: string) {
  const userId = useAuthStore((s) => s.user?.id);
  // Wait for the stored session, so a signed-in learner is not first served the anonymous view.
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  return useQuery({
    queryKey: programKeys.detail(slug, userId),
    queryFn: () => programService.getProgramBySlug(slug),
    enabled: !!slug && hasHydrated,
  });
}

/* ---------------------------------- Admin --------------------------------- */

export function useAdminPrograms(query: AdminProgramListQuery = {}) {
  return useQuery({
    queryKey: programKeys.adminList(query),
    queryFn: () => programService.listAdminPrograms(query),
  });
}

export function useAdminProgram(idOrSlug: string) {
  return useQuery({
    queryKey: programKeys.adminDetail(idOrSlug),
    queryFn: () => programService.getAdminProgram(idOrSlug),
    enabled: !!idOrSlug,
  });
}

/** After any admin write: admin lists and details, plus the public catalog and pages. */
function useInvalidatePrograms() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: programKeys.admin }),
      qc.invalidateQueries({ queryKey: programKeys.catalog }),
      qc.invalidateQueries({ queryKey: ['program'] }),
    ]);
}

export function useCreateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (body: CreateProgramBody) => programService.createProgram(body),
    onSuccess: invalidate,
  });
}

export function useUpdateProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateProgramBody }) => programService.updateProgram(id, body),
    onSuccess: invalidate,
  });
}

export function useDeleteProgram() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (id: string) => programService.deleteProgram(id),
    onSuccess: invalidate,
  });
}

/* ------------------------------- Curriculum ------------------------------- */

export function useCreateTrack() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ programId, body }: { programId: string; body: CreateTrackBody }) =>
      programService.createTrack(programId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateTrack() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ trackId, body }: { trackId: string; body: UpdateTrackBody }) => programService.updateTrack(trackId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteTrack() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (trackId: string) => programService.deleteTrack(trackId),
    onSuccess: invalidate,
  });
}

export function useCreateModule() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ trackId, body }: { trackId: string; body: CreateModuleBody }) =>
      programService.createModule(trackId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateModule() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: string; body: UpdateModuleBody }) =>
      programService.updateModule(moduleId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteModule() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (moduleId: string) => programService.deleteModule(moduleId),
    onSuccess: invalidate,
  });
}

export function useCreateNode() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: string; body: CreateNodeBody }) => programService.createNode(moduleId, body),
    onSuccess: invalidate,
  });
}

export function useUpdateNode() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: ({ nodeId, body }: { nodeId: string; body: UpdateNodeBody }) => programService.updateNode(nodeId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteNode() {
  const invalidate = useInvalidatePrograms();
  return useMutation({
    mutationFn: (nodeId: string) => programService.deleteNode(nodeId),
    onSuccess: invalidate,
  });
}
