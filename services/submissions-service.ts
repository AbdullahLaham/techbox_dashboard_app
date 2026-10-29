// services/submissions-service.ts
// Assignment hand-ins (types/submissions.contract.ts): the student's submit form and the reviewers' grading.
// Failed calls reject with the axios error; read it with the helpers in lib/api-error.ts.
import type { AxiosProgressEvent } from 'axios';
import { apiClient } from '@/services/auth-service';
import { API_ERROR_MESSAGES_AR } from '@/types/api.contract';
import {
  SUBMISSIONS_ENDPOINTS,
  SUBMISSION_LIMITS,
  type AdminSubmission,
  type AdminSubmissionList,
  type AdminSubmissionListQuery,
  type GradeSubmissionBody,
  type MySubmissionResponse,
  type SubmissionView,
  type SubmitAssignmentBody,
} from '@/types/submissions.contract';

/** Value for `<input type="file" accept={...}>`. */
export const SUBMISSION_FILE_ACCEPT = Object.keys(SUBMISSION_LIMITS.allowedFileTypes).join(',');

/**
 * Browser-side check before handing in a file. Returns an Arabic message, or null when the file
 * looks fine. Extension only: the server still checks the real file type and size.
 */
export function validateSubmissionFile(file: { name: string; size: number }): string | null {
  if (file.size > SUBMISSION_LIMITS.maxFileBytes) return API_ERROR_MESSAGES_AR.FILE_TOO_LARGE;
  const dot = file.name.lastIndexOf('.');
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!(extension in SUBMISSION_LIMITS.allowedFileTypes)) return API_ERROR_MESSAGES_AR.UNSUPPORTED_FILE_TYPE;
  return null;
}

export type SubmitOptions = {
  /** 0 to 100; only reported when files are sent. */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export const submissionsApi = {
  /** The student's attempts on one assignment and whether they may hand in now. */
  async getMySubmission(assignmentId: string, signal?: AbortSignal): Promise<MySubmissionResponse> {
    const res = await apiClient.get<MySubmissionResponse>(SUBMISSIONS_ENDPOINTS.mySubmission(assignmentId), { signal });
    return res.data;
  },

  /**
   * Hands in a new attempt. Without files the body goes as JSON; with files it is multipart, the
   * files repeated under `files` and the links under `links`. Refused with 409 SUBMISSION_LOCKED while
   * the previous attempt waits for review or is closed.
   */
  async submit(
    assignmentId: string,
    body: SubmitAssignmentBody,
    files: readonly File[] = [],
    options: SubmitOptions = {},
  ): Promise<SubmissionView> {
    const endpoint = SUBMISSIONS_ENDPOINTS.submit(assignmentId);
    if (files.length === 0) {
      const res = await apiClient.post<SubmissionView>(endpoint, body, { signal: options.signal });
      return res.data;
    }

    const form = new FormData();
    for (const file of files) form.append('files', file);
    for (const link of body.links ?? []) form.append('links', link);
    if (body.text) form.append('text', body.text);

    const res = await apiClient.post<SubmissionView>(endpoint, form, {
      signal: options.signal,
      timeout: 0, // up to 5 × 20 MB on slow connections must not hit the instance's default timeout
      // The shared instance defaults to application/json, which makes axios serialize FormData
      // to JSON. Overriding it keeps the body multipart; the browser then sets the boundary.
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    });
    return res.data;
  },
};

export const submissionsAdminApi = {
  /** Review queue of one assignment, with counts per status. */
  async list(assignmentId: string, query: AdminSubmissionListQuery, signal?: AbortSignal): Promise<AdminSubmissionList> {
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''));
    const res = await apiClient.get<AdminSubmissionList>(SUBMISSIONS_ENDPOINTS.adminAssignmentSubmissions(assignmentId), {
      params,
      signal,
    });
    return res.data;
  },

  /** One hand-in. File `url`s are signed (about 1 hour): never store them. */
  async get(submissionId: string, signal?: AbortSignal): Promise<AdminSubmission> {
    const res = await apiClient.get<AdminSubmission>(SUBMISSIONS_ENDPOINTS.adminSubmission(submissionId), { signal });
    return res.data;
  },

  /** Notifies the student; GRADED also completes the lesson in their progress. */
  async grade(submissionId: string, body: GradeSubmissionBody): Promise<AdminSubmission> {
    const res = await apiClient.patch<AdminSubmission>(SUBMISSIONS_ENDPOINTS.adminGrade(submissionId), body);
    return res.data;
  },
};
