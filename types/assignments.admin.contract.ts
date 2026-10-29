// types/assignments.admin.contract.ts  (copied from assignments.spec.md §18; shared with the NestJS backend)
/**
 * Assignments admin contract
 * --------------------------
 * Companion to ASSIGNMENTS_CRUD_SPEC.md and to assignments.contract.ts (the mobile list contract).
 * Adjust the import below to wherever assignments.contract.ts lives in each project.
 */
import type { SubmissionType } from './assignments.contract';

export const ADMIN_ASSIGNMENTS_ENDPOINT = '/v1/admin/assignments' as const;

/* -------------------------------------------------------------------------- */
/*  Status lifecycle                                                          */
/* -------------------------------------------------------------------------- */

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ProgramStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'ARCHIVED';

/**
 * Allowed status changes. Extra server rule:
 * PUBLISHED -> DRAFT is refused (409 ASSIGNMENT_HAS_SUBMISSIONS) when the assignment has any submission.
 */
export const ASSIGNMENT_STATUS_TRANSITIONS: Record<AssignmentStatus, readonly AssignmentStatus[]> = {
  DRAFT: ['PUBLISHED'],
  PUBLISHED: ['DRAFT', 'ARCHIVED'],
  ARCHIVED: ['PUBLISHED'],
};

/* -------------------------------------------------------------------------- */
/*  Limits (single source of truth for the backend validators and the UI)     */
/* -------------------------------------------------------------------------- */

export const ASSIGNMENT_LIMITS = {
  titleMin: 3,
  titleMax: 200,
  instructionsMax: 10_000,
  /** Assignment.maxScore is Decimal(5,2) */
  maxScoreMax: 999.99,
} as const;

export const ATTACHMENT_LIMITS = {
  maxCount: 5,
  maxBytes: 20 * 1024 * 1024,
  /** Allowed MIME type -> allowed extensions. The server also checks the file's magic bytes. */
  allowed: {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'text/plain': ['.txt'],
    'application/zip': ['.zip'],
  } as Record<string, readonly string[]>,
} as const;

/* -------------------------------------------------------------------------- */
/*  Shared shapes                                                             */
/* -------------------------------------------------------------------------- */

export type IdTitle = { id: string; title: string };

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

/** A file attached to an assignment's instructions. `url` is generated at read time. */
export type AdminAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Download URL. May be time-limited (signed), so never store it. */
  url: string;
  createdAt: string;
};

/* -------------------------------------------------------------------------- */
/*  Admin: list + detail                                                      */
/* -------------------------------------------------------------------------- */

export type AdminAssignmentListItem = {
  /** Assignment.id */
  id: string;
  /** ActivityNode.title */
  title: string;
  status: AssignmentStatus;
  allowedType: SubmissionType;
  maxScore: number;
  dueDate: string | null;
  /** null while DRAFT */
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  program: IdTitle;
  track: IdTitle;
  module: IdTitle;
  /** Number of Submission rows (every attempt counts) */
  submissionsCount: number;
  /** Submission rows with status SUBMITTED or UNDER_REVIEW */
  pendingReviewCount: number;
  attachmentsCount: number;
};

export type AdminAssignmentDetail = AdminAssignmentListItem & {
  instructions: string;
  /** ActivityNode.isMandatory */
  isMandatory: boolean;
  /** ActivityNode.orderIndex (position inside the module) */
  orderIndex: number;
  attachments: AdminAttachment[];
};

export type AdminAssignmentSort =
  | 'createdAt'
  | '-createdAt'
  | 'dueDate'
  | '-dueDate'
  | 'title'
  | '-title'
  | 'publishedAt'
  | '-publishedAt';

export type AdminAssignmentListQuery = {
  /** default 1 */
  page?: number;
  /** default 20, max 100 */
  pageSize?: number;
  /** case-insensitive match on the title */
  q?: string;
  programId?: string;
  trackId?: string;
  moduleId?: string;
  status?: AssignmentStatus;
  /** default '-createdAt' */
  sort?: AdminAssignmentSort;
};

/* -------------------------------------------------------------------------- */
/*  Admin: write bodies                                                       */
/* -------------------------------------------------------------------------- */

export type CreateAssignmentBody = {
  /** The module the assignment lives in (this decides program and students) */
  moduleId: string;
  title: string;
  instructions: string;
  /** default 'URL_LINK' */
  allowedType?: SubmissionType;
  /** default 100; must be > 0 and <= 999.99, max 2 decimals */
  maxScore?: number;
  /** ISO date in the future, or null for no deadline */
  dueDate?: string | null;
  /** default true */
  isMandatory?: boolean;
  /** default: last position in the module */
  orderIndex?: number;
};

/** Partial update. Omitted = unchanged. `dueDate: null` clears the deadline. `moduleId` cannot change. */
export type UpdateAssignmentBody = Partial<Omit<CreateAssignmentBody, 'moduleId'>>;

export type ChangeStatusBody = { status: AssignmentStatus };

/* -------------------------------------------------------------------------- */
/*  Admin: form helper (programs > tracks > modules)                          */
/* -------------------------------------------------------------------------- */

export type AssignmentTargetsResponse = {
  programs: Array<{
    id: string;
    title: string;
    status: ProgramStatus;
    tracks: Array<{
      id: string;
      title: string;
      modules: IdTitle[];
    }>;
  }>;
};

/* -------------------------------------------------------------------------- */
/*  Errors                                                                    */
/* -------------------------------------------------------------------------- */

export type AssignmentErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ASSIGNMENT_HAS_SUBMISSIONS'
  | 'ALLOWED_TYPE_LOCKED'
  | 'MAX_SCORE_BELOW_EXISTING_SCORES'
  | 'INVALID_STATUS_TRANSITION'
  | 'ATTACHMENT_LIMIT_REACHED'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  /** Upload rate limit (20 per minute per user). */
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR';

export type AssignmentApiError = {
  statusCode: number;
  code: AssignmentErrorCode;
  message: string;
  /** For VALIDATION_FAILED: field name -> message */
  details?: Record<string, string>;
};

/** Messages the dashboard can show for each code. */
export const ASSIGNMENT_ERROR_MESSAGES_AR: Record<AssignmentErrorCode, string> = {
  VALIDATION_FAILED: 'يرجى تصحيح الحقول المحددة ثم إعادة المحاولة.',
  UNAUTHORIZED: 'انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.',
  FORBIDDEN: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
  NOT_FOUND: 'العنصر غير موجود أو تم حذفه.',
  ASSIGNMENT_HAS_SUBMISSIONS: 'لا يمكن تنفيذ هذا الإجراء لأن الواجب لديه تسليمات. يمكنك أرشفته بدلاً من ذلك.',
  ALLOWED_TYPE_LOCKED: 'لا يمكن تغيير نوع التسليم بعد وجود تسليمات.',
  MAX_SCORE_BELOW_EXISTING_SCORES: 'الدرجة العظمى أقل من درجات مُسجّلة بالفعل لطلاب.',
  INVALID_STATUS_TRANSITION: 'هذا التغيير في حالة الواجب غير مسموح.',
  ATTACHMENT_LIMIT_REACHED: `وصلت إلى الحد الأقصى لعدد المرفقات (${ATTACHMENT_LIMITS.maxCount}).`,
  FILE_TOO_LARGE: `حجم الملف يتجاوز ${ATTACHMENT_LIMITS.maxBytes / (1024 * 1024)} ميجابايت.`,
  UNSUPPORTED_FILE_TYPE: 'نوع الملف غير مدعوم.',
  TOO_MANY_REQUESTS: 'رفعت ملفات كثيرة خلال وقت قصير، حاول مجدداً بعد دقيقة.',
  INTERNAL_ERROR: 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.',
};
