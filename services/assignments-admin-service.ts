// services/assignments-admin-service.ts  (admin API, assignments.spec.md §19.6; runs in the browser)
import { isAxiosError, isCancel, type AxiosProgressEvent } from 'axios';
import { api } from '@/lib/api'; // your configured axios instance (baseURL + Bearer interceptor)
import {
  ADMIN_ASSIGNMENTS_ENDPOINT,
  ASSIGNMENT_ERROR_MESSAGES_AR,
  ATTACHMENT_LIMITS,
  type AdminAssignmentDetail,
  type AdminAssignmentListItem,
  type AdminAssignmentListQuery,
  type AdminAttachment,
  type AssignmentApiError,
  type AssignmentErrorCode,
  type AssignmentStatus,
  type AssignmentTargetsResponse,
  type ChangeStatusBody,
  type CreateAssignmentBody,
  type Paginated,
  type UpdateAssignmentBody,
} from '@/types/assignments.admin.contract';

/* -------------------------------------------------------------------------- */
/*  Errors                                                                    */
/* -------------------------------------------------------------------------- */

/** Every failed admin call rejects with this (except cancelled requests, which stay as axios cancel errors). */
export class AssignmentRequestError extends Error {
  readonly statusCode: number;
  readonly code: AssignmentErrorCode;
  /** For VALIDATION_FAILED: field name -> message. Show each next to its field. */
  readonly details?: Record<string, string>;

  constructor(init: {
    statusCode: number;
    code: AssignmentErrorCode;
    message: string;
    details?: Record<string, string>;
  }) {
    super(init.message);
    Object.setPrototypeOf(this, AssignmentRequestError.prototype);
    this.name = 'AssignmentRequestError';
    this.statusCode = init.statusCode;
    this.code = init.code;
    this.details = init.details;
  }

  /** Arabic text ready to show in the dashboard. */
  get userMessage(): string {
    return ASSIGNMENT_ERROR_MESSAGES_AR[this.code];
  }

  /** The request never reached the server (offline, timeout, CORS). */
  get isNetworkError(): boolean {
    return this.statusCode === 0;
  }
}

export function isAssignmentRequestError(error: unknown): error is AssignmentRequestError {
  return error instanceof AssignmentRequestError;
}

const CODE_BY_STATUS: Partial<Record<number, AssignmentErrorCode>> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  413: 'FILE_TOO_LARGE',
  415: 'UNSUPPORTED_FILE_TYPE',
  429: 'TOO_MANY_REQUESTS',
};

function isKnownCode(value: unknown): value is AssignmentErrorCode {
  return typeof value === 'string' && value in ASSIGNMENT_ERROR_MESSAGES_AR;
}

function toRequestError(error: unknown): unknown {
  if (isCancel(error) || !isAxiosError(error)) return error;

  const statusCode = error.response?.status ?? 0;
  const body = error.response?.data as Partial<AssignmentApiError> | undefined;
  const bodyCode = body?.code;
  const code: AssignmentErrorCode = isKnownCode(bodyCode)
    ? bodyCode
    : (CODE_BY_STATUS[statusCode] ?? 'INTERNAL_ERROR');

  return new AssignmentRequestError({
    statusCode,
    code,
    message: body?.message ?? error.message,
    details: body?.details,
  });
}

async function unwrap<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    throw toRequestError(error);
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const BASE = ADMIN_ASSIGNMENTS_ENDPOINT;

const url = (...parts: string[]): string => [BASE, ...parts.map(encodeURIComponent)].join('/');

/** Drops empty values so the query string stays clean. */
function cleanQuery(query: AdminAssignmentListQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    const text = typeof value === 'string' ? value.trim() : value;
    if (text === '') continue;
    params[key] = text;
  }
  return params;
}

const ALLOWED_EXTENSIONS = new Set(
  Object.values(ATTACHMENT_LIMITS.allowed)
    .flat()
    .map((ext) => ext.toLowerCase()),
);

/** Value for `<input type="file" accept={...}>`. */
export const ATTACHMENT_ACCEPT = [...ALLOWED_EXTENSIONS].join(',');

/**
 * Quick browser-side check before uploading. Returns an Arabic message, or null when the file looks fine.
 * It checks the extension only (browsers report inconsistent MIME types, for example for .zip on Windows);
 * the server still verifies the real file type, size and count.
 */
export function validateAttachmentFile(
  file: { name: string; size: number },
  currentCount: number,
): string | null {
  if (currentCount >= ATTACHMENT_LIMITS.maxCount) return ASSIGNMENT_ERROR_MESSAGES_AR.ATTACHMENT_LIMIT_REACHED;
  if (file.size > ATTACHMENT_LIMITS.maxBytes) return ASSIGNMENT_ERROR_MESSAGES_AR.FILE_TOO_LARGE;

  const dot = file.name.lastIndexOf('.');
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.has(extension)) return ASSIGNMENT_ERROR_MESSAGES_AR.UNSUPPORTED_FILE_TYPE;

  return null;
}

export type UploadOptions = {
  /** 0 to 100 */
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

/* -------------------------------------------------------------------------- */
/*  API                                                                       */
/* -------------------------------------------------------------------------- */

export const assignmentsAdminApi = {
  /** Paginated list with filters and sorting. */
  list(query: AdminAssignmentListQuery = {}, signal?: AbortSignal): Promise<Paginated<AdminAssignmentListItem>> {
    return unwrap(api.get<Paginated<AdminAssignmentListItem>>(BASE, { params: cleanQuery(query), signal }));
  },

  get(id: string, signal?: AbortSignal): Promise<AdminAssignmentDetail> {
    return unwrap(api.get<AdminAssignmentDetail>(url(id), { signal }));
  },

  /** Always creates a DRAFT. Publish with changeStatus. */
  create(body: CreateAssignmentBody): Promise<AdminAssignmentDetail> {
    return unwrap(api.post<AdminAssignmentDetail>(BASE, body));
  },

  /** Partial update: omitted fields stay unchanged, `dueDate: null` clears the deadline. `moduleId` cannot change. */
  update(id: string, body: UpdateAssignmentBody): Promise<AdminAssignmentDetail> {
    return unwrap(api.patch<AdminAssignmentDetail>(url(id), body));
  },

  changeStatus(id: string, status: AssignmentStatus): Promise<AdminAssignmentDetail> {
    const body: ChangeStatusBody = { status };
    return unwrap(api.patch<AdminAssignmentDetail>(url(id, 'status'), body));
  },

  /** Only works without submissions (otherwise rejects with ASSIGNMENT_HAS_SUBMISSIONS: offer "archive"). */
  async remove(id: string): Promise<void> {
    await unwrap(api.delete<void>(url(id)));
  },

  /** Uploads one instruction file directly to the API (never through a Next.js route handler). */
  uploadAttachment(assignmentId: string, file: File, options: UploadOptions = {}): Promise<AdminAttachment> {
    const form = new FormData();
    form.append('file', file); // the field name must be "file"

    return unwrap(
      api.post<AdminAttachment>(url(assignmentId, 'attachments'), form, {
        signal: options.signal,
        timeout: 0, // large files on slow connections must not hit the instance's default timeout
        // The shared instance defaults to application/json, which makes axios serialize FormData
        // to JSON. Overriding it keeps the body multipart; the browser then sets the boundary.
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (event.total) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
        },
      }),
    );
  },

  async deleteAttachment(assignmentId: string, attachmentId: string): Promise<void> {
    await unwrap(api.delete<void>(url(assignmentId, 'attachments', attachmentId)));
  },

  /** Programs > tracks > modules for the create form's cascading selects. */
  getTargets(signal?: AbortSignal): Promise<AssignmentTargetsResponse> {
    return unwrap(api.get<AssignmentTargetsResponse>(url('targets'), { signal }));
  },
};
