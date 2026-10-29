// services/assignments-service.ts  (student API, assignments.spec.md §19.4)
import { isAxiosError } from 'axios';
import { api } from '@/lib/api'; // your configured axios instance (baseURL + Bearer interceptor)
import {
  ASSIGNMENTS_ENDPOINT,
  type AssignmentDetail,
  type AssignmentItem,
  type AssignmentsResponse,
} from '@/types/assignments.contract';

export const assignmentsApi = {
  /** All published assignments of the student's programs, each with the student's latest submission. */
  async getMyAssignments(signal?: AbortSignal): Promise<AssignmentItem[]> {
    const { data } = await api.get<AssignmentsResponse>(ASSIGNMENTS_ENDPOINT, { signal });
    return data.items;
  },

  /** One assignment with its instructions and files. File `url`s expire (about 1 hour): never store them. */
  async getAssignment(id: string, signal?: AbortSignal): Promise<AssignmentDetail> {
    const { data } = await api.get<AssignmentDetail>(`${ASSIGNMENTS_ENDPOINT}/${encodeURIComponent(id)}`, {
      signal,
    });
    return data;
  },
};

/**
 * True when the API answered 404: the assignment is not (or no longer) visible to this student
 * (unpublished, archived, deleted, or the student is not enrolled).
 */
export function isAssignmentNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}
