// services/nodes-service.ts
// Lessons as the learner opens them, and lesson progress (types/nodes.contract.ts).
import { apiClient } from '@/services/auth-service';
import { TOKEN_STORAGE_KEY } from '@/store/use-auth-store';
import {
  NODES_ENDPOINTS,
  type LessonProgressResult,
  type NodeContent,
  type UpdateLessonProgressBody,
} from '@/types/nodes.contract';

export const nodesApi = {
  /** VIDEO_LECTURE, READING_MATERIAL and QUIZ lessons, for accepted learners and staff (404 otherwise). */
  async get(nodeId: string, signal?: AbortSignal): Promise<NodeContent> {
    const res = await apiClient.get<NodeContent>(NODES_ENDPOINTS.node(nodeId), { signal });
    return res.data;
  },

  /** Video position (`positionSec`) or `completed: true`. Completion is never undone. */
  async updateProgress(nodeId: string, body: UpdateLessonProgressBody): Promise<LessonProgressResult> {
    const res = await apiClient.post<LessonProgressResult>(NODES_ENDPOINTS.nodeProgress(nodeId), body);
    return res.data;
  },

  /**
   * Same as updateProgress, but survives the page closing (keepalive). Fire and forget: no
   * token refresh and no response, so it is only used for the last position on the way out.
   */
  sendProgressOnExit(nodeId: string, body: UpdateLessonProgressBody): void {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return;
    // Joined like axios does, so a base URL with a path prefix keeps it.
    const url = `${(apiClient.defaults.baseURL ?? '').replace(/\/+$/, '')}${NODES_ENDPOINTS.nodeProgress(nodeId)}`;
    void fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    }).catch(() => undefined);
  },
};
