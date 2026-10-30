// hooks/use-lessons.ts
// A lesson as the learner opens it, and saving lesson progress (types/nodes.contract.ts).
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { enrollmentKeys } from '@/hooks/use-enrollments';
import { programKeys } from '@/hooks/use-programs';
import { nodesApi } from '@/services/nodes-service';
import { useAuthStore } from '@/store/use-auth-store';
import type { ProgramDetail } from '@/types/api.contract';
import type { LessonProgressResult, NodeContent, UpdateLessonProgressBody } from '@/types/nodes.contract';

export const lessonKeys = {
  // Progress is the caller's own, so the lesson is cached per user.
  content: (nodeId: string, userId: string | undefined) => ['lesson', nodeId, userId ?? 'anonymous'] as const,
};

/** Signed file links last about an hour, so refresh well before they expire. */
const FILE_URL_REFRESH_MS = 45 * 60 * 1000;

export function useLessonContent(nodeId: string, { enabled = true }: { enabled?: boolean } = {}) {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: lessonKeys.content(nodeId, userId),
    queryFn: ({ signal }) => nodesApi.get(nodeId, signal),
    enabled: enabled && !!nodeId,
    refetchInterval: (query) => (query.state.data?.resource?.kind === 'FILE' ? FILE_URL_REFRESH_MS : false),
  });
}

/**
 * Puts a progress response into the lesson, the program page (curriculum ticks, progress bar)
 * and, when a lesson was just completed, refreshes the learner's enrollments (dashboard).
 */
function applyProgressResult(qc: QueryClient, userId: string | undefined, programSlug: string, result: LessonProgressResult) {
  const { nodeId, programProgress } = result;
  const progress = {
    isCompleted: result.isCompleted,
    completionPct: result.completionPct,
    lastPositionSec: result.lastPositionSec,
    watchedSeconds: result.watchedSeconds,
  };
  let newlyCompleted = false;

  qc.setQueryData<NodeContent>(lessonKeys.content(nodeId, userId), (old) => {
    if (!old) return old;
    newlyCompleted = progress.isCompleted && !old.progress.isCompleted;
    return { ...old, isCompleted: progress.isCompleted, progress };
  });

  qc.setQueryData<ProgramDetail>(programKeys.detail(programSlug, userId), (old) => {
    if (!old) return old;
    const tracks = old.tracks.map((track) => ({
      ...track,
      modules: track.modules.map((mod) => ({
        ...mod,
        nodes: mod.nodes.map((node) => {
          if (node.id !== nodeId || node.isCompleted === progress.isCompleted) return node;
          newlyCompleted ||= progress.isCompleted;
          return { ...node, isCompleted: progress.isCompleted };
        }),
      })),
    }));
    const myEnrollment =
      old.myEnrollment && programProgress
        ? {
            ...old.myEnrollment,
            progressPct: programProgress.percent,
            completedLessons: programProgress.completedLessons,
            totalLessons: programProgress.totalLessons,
          }
        : old.myEnrollment;
    return { ...old, tracks, myEnrollment };
  });

  if (newlyCompleted) void qc.invalidateQueries({ queryKey: enrollmentKeys.mine(userId) });
}

/**
 * Saves the learner's position in a video or marks a lesson done. Only call it for learners
 * (staff previews are not recorded by the server anyway).
 */
export function useUpdateLessonProgress(nodeId: string, programSlug: string) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (body: UpdateLessonProgressBody) => nodesApi.updateProgress(nodeId, body),
    // Runs even when the lesson was closed meanwhile (switching lessons saves the last position).
    onSuccess: (result) => applyProgressResult(qc, userId, programSlug, result),
  });
}
