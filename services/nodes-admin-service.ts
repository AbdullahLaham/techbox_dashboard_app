// services/nodes-admin-service.ts
// Admin lessons (VIDEO_LECTURE, READING_MATERIAL, QUIZ) and quizzes (types/nodes.contract.ts).
// Failed calls reject with the axios error; read it with the helpers in lib/api-error.ts.
import type { AxiosProgressEvent } from 'axios';
import { apiClient } from '@/services/auth-service';
import { API_ERROR_MESSAGES_AR } from '@/types/api.contract';
import {
  NODES_ENDPOINTS,
  NODE_FILE_LIMITS,
  type AdminNodeDetail,
  type AdminQuiz,
  type AdminQuizAttemptDetail,
  type AdminQuizAttemptList,
  type AdminQuizAttemptListQuery,
  type CreateNodeBody,
  type CreateQuizQuestionBody,
  type UpdateNodeBody,
  type UpdateQuizBody,
  type UpdateQuizQuestionBody,
} from '@/types/nodes.contract';

/** Value for `<input type="file" accept={...}>`. */
export const NODE_FILE_ACCEPT = Object.keys(NODE_FILE_LIMITS.allowedTypes).join(',');

/**
 * Browser-side check before uploading a reading file. Returns an Arabic message, or null when the
 * file looks fine. Extension only: the server still checks the real file type and size.
 */
export function validateNodeFile(file: { name: string; size: number }): string | null {
  if (file.size > NODE_FILE_LIMITS.maxBytes) return API_ERROR_MESSAGES_AR.FILE_TOO_LARGE;
  const dot = file.name.lastIndexOf('.');
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!(extension in NODE_FILE_LIMITS.allowedTypes)) return API_ERROR_MESSAGES_AR.UNSUPPORTED_FILE_TYPE;
  return null;
}

export type NodeFileUploadOptions = {
  /** 0 to 100 */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export const nodesAdminApi = {
  /* ------------------------------ Lessons ------------------------------ */

  async getNode(nodeId: string, signal?: AbortSignal): Promise<AdminNodeDetail> {
    const res = await apiClient.get<AdminNodeDetail>(NODES_ENDPOINTS.adminNode(nodeId), { signal });
    return res.data;
  },

  /** QUIZ lessons get their (unpublished) quiz at the same time. */
  async createNode(body: CreateNodeBody): Promise<AdminNodeDetail> {
    const res = await apiClient.post<AdminNodeDetail>(NODES_ENDPOINTS.adminNodes, body);
    return res.data;
  },

  /** `link` replaces a stored reading file (the server deletes it). */
  async updateNode(nodeId: string, body: UpdateNodeBody): Promise<AdminNodeDetail> {
    const res = await apiClient.patch<AdminNodeDetail>(NODES_ENDPOINTS.adminNode(nodeId), body);
    return res.data;
  },

  /** Owners only. Refused with 409 QUIZ_HAS_ATTEMPTS once students attempted the lesson's quiz. */
  async deleteNode(nodeId: string): Promise<void> {
    await apiClient.delete(NODES_ENDPOINTS.adminNode(nodeId));
  },

  /** READING_MATERIAL: uploads straight to the API and replaces the current link or file. */
  async uploadNodeFile(nodeId: string, file: File, options: NodeFileUploadOptions = {}): Promise<AdminNodeDetail> {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<AdminNodeDetail>(NODES_ENDPOINTS.adminNodeFile(nodeId), form, {
      signal: options.signal,
      timeout: 0, // up to 50 MB on slow connections must not hit the instance's default timeout
      // The shared instance defaults to application/json, which makes axios serialize FormData
      // to JSON. Overriding it keeps the body multipart; the browser then sets the boundary.
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    return res.data;
  },

  /** Removes the link or file of a reading lesson. */
  async deleteNodeResource(nodeId: string): Promise<AdminNodeDetail> {
    const res = await apiClient.delete<AdminNodeDetail>(NODES_ENDPOINTS.adminNodeResource(nodeId));
    return res.data;
  },

  /* ------------------------------ Quizzes ------------------------------ */

  /** Includes the correct answers. */
  async getQuiz(quizId: string, signal?: AbortSignal): Promise<AdminQuiz> {
    const res = await apiClient.get<AdminQuiz>(NODES_ENDPOINTS.adminQuiz(quizId), { signal });
    return res.data;
  },

  /** Settings and publishing (`isPublished`). Publishing an incomplete quiz gives 409 QUIZ_NOT_READY. */
  async updateQuiz(quizId: string, body: UpdateQuizBody): Promise<AdminQuiz> {
    const res = await apiClient.patch<AdminQuiz>(NODES_ENDPOINTS.adminQuiz(quizId), body);
    return res.data;
  },

  async addQuestion(quizId: string, body: CreateQuizQuestionBody): Promise<AdminQuiz> {
    const res = await apiClient.post<AdminQuiz>(NODES_ENDPOINTS.adminQuizQuestions(quizId), body);
    return res.data;
  },

  /** `options` (all 4) are updated in place by position, so their ids stay the same. */
  async updateQuestion(questionId: string, body: UpdateQuizQuestionBody): Promise<AdminQuiz> {
    const res = await apiClient.patch<AdminQuiz>(NODES_ENDPOINTS.adminQuizQuestion(questionId), body);
    return res.data;
  },

  async deleteQuestion(questionId: string): Promise<AdminQuiz> {
    const res = await apiClient.delete<AdminQuiz>(NODES_ENDPOINTS.adminQuizQuestion(questionId));
    return res.data;
  },

  /* ------------------------------ Attempts ----------------------------- */

  /** Newest first. `stats` covers the whole quiz, not only the current filter. */
  async listAttempts(quizId: string, query: AdminQuizAttemptListQuery = {}, signal?: AbortSignal): Promise<AdminQuizAttemptList> {
    const res = await apiClient.get<AdminQuizAttemptList>(NODES_ENDPOINTS.adminQuizAttempts(quizId), { params: query, signal });
    return res.data;
  },

  async getAttempt(attemptId: string, signal?: AbortSignal): Promise<AdminQuizAttemptDetail> {
    const res = await apiClient.get<AdminQuizAttemptDetail>(NODES_ENDPOINTS.adminQuizAttempt(attemptId), { signal });
    return res.data;
  },
};
