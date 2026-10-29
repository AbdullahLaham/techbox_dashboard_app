// hooks/use-admin-nodes.ts
// Admin lessons and quizzes. Every write returns the fresh lesson or quiz, which goes straight
// into the cache; the curriculum tree (programs) is refreshed because it shows lesson titles.
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { programKeys } from '@/hooks/use-programs';
import { nodesAdminApi, type NodeFileUploadOptions } from '@/services/nodes-admin-service';
import type {
  AdminNodeDetail,
  AdminQuiz,
  AdminQuizAttemptListQuery,
  CreateNodeBody,
  CreateQuizQuestionBody,
  UpdateNodeBody,
  UpdateQuizBody,
  UpdateQuizQuestionBody,
} from '@/types/nodes.contract';

export const lessonKeys = {
  all: ['admin-lessons'] as const,
  node: (nodeId: string) => [...lessonKeys.all, 'node', nodeId] as const,
  quiz: (quizId: string) => [...lessonKeys.all, 'quiz', quizId] as const,
  attemptsOf: (quizId: string) => [...lessonKeys.all, 'attempts', quizId] as const,
  attempts: (quizId: string, query: AdminQuizAttemptListQuery) => [...lessonKeys.attemptsOf(quizId), query] as const,
  attempt: (attemptId: string) => [...lessonKeys.all, 'attempt', attemptId] as const,
};

function refreshCurriculum(qc: QueryClient) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: programKeys.admin }),
    qc.invalidateQueries({ queryKey: programKeys.catalog }),
    qc.invalidateQueries({ queryKey: ['program'] }),
  ]);
}

/* --------------------------------- Reads ---------------------------------- */

export function useAdminNode(nodeId: string) {
  return useQuery({
    queryKey: lessonKeys.node(nodeId),
    queryFn: ({ signal }) => nodesAdminApi.getNode(nodeId, signal),
    enabled: !!nodeId,
  });
}

export function useAdminQuiz(quizId: string | undefined) {
  return useQuery({
    queryKey: lessonKeys.quiz(quizId ?? ''),
    queryFn: ({ signal }) => nodesAdminApi.getQuiz(quizId as string, signal),
    enabled: !!quizId,
  });
}

export function useQuizAttempts(quizId: string | undefined, query: AdminQuizAttemptListQuery) {
  return useQuery({
    queryKey: lessonKeys.attempts(quizId ?? '', query),
    queryFn: ({ signal }) => nodesAdminApi.listAttempts(quizId as string, query, signal),
    enabled: !!quizId,
    placeholderData: keepPreviousData,
  });
}

export function useQuizAttempt(attemptId: string) {
  return useQuery({
    queryKey: lessonKeys.attempt(attemptId),
    queryFn: ({ signal }) => nodesAdminApi.getAttempt(attemptId, signal),
    enabled: !!attemptId,
  });
}

/* --------------------------------- Lessons -------------------------------- */

function useNodeWrite<TVars>(mutationFn: (vars: TVars) => Promise<AdminNodeDetail>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (node) => {
      qc.setQueryData(lessonKeys.node(node.id), node);
      return refreshCurriculum(qc);
    },
  });
}

export function useCreateLesson() {
  return useNodeWrite((body: CreateNodeBody) => nodesAdminApi.createNode(body));
}

export function useUpdateLesson(nodeId: string) {
  return useNodeWrite((body: UpdateNodeBody) => nodesAdminApi.updateNode(nodeId, body));
}

export function useUploadLessonFile(nodeId: string) {
  return useNodeWrite(({ file, ...options }: NodeFileUploadOptions & { file: File }) =>
    nodesAdminApi.uploadNodeFile(nodeId, file, options),
  );
}

export function useDeleteLessonResource(nodeId: string) {
  return useNodeWrite(() => nodesAdminApi.deleteNodeResource(nodeId));
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) => nodesAdminApi.deleteNode(nodeId),
    // The lesson's own cache entry is left alone: removing it while its page is still open
    // would refetch it and flash "not found" before the redirect.
    onSuccess: () => refreshCurriculum(qc),
  });
}

/* --------------------------------- Quizzes -------------------------------- */

/** Stores the returned quiz and refreshes the lesson, whose quiz summary (counts, published) changed. */
function useQuizWrite<TVars>(mutationFn: (vars: TVars) => Promise<AdminQuiz>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (quiz) => {
      qc.setQueryData(lessonKeys.quiz(quiz.id), quiz);
      return Promise.all([qc.invalidateQueries({ queryKey: lessonKeys.node(quiz.nodeId) }), refreshCurriculum(qc)]);
    },
  });
}

export function useUpdateQuiz(quizId: string) {
  return useQuizWrite((body: UpdateQuizBody) => nodesAdminApi.updateQuiz(quizId, body));
}

export function useAddQuestion(quizId: string) {
  return useQuizWrite((body: CreateQuizQuestionBody) => nodesAdminApi.addQuestion(quizId, body));
}

export function useUpdateQuestion() {
  return useQuizWrite(({ questionId, body }: { questionId: string; body: UpdateQuizQuestionBody }) =>
    nodesAdminApi.updateQuestion(questionId, body),
  );
}

export function useDeleteQuestion() {
  return useQuizWrite((questionId: string) => nodesAdminApi.deleteQuestion(questionId));
}
