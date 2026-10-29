// lib/assignment-errors.ts
import { isAssignmentRequestError } from '@/services/assignments-admin-service';
import { ASSIGNMENT_ERROR_MESSAGES_AR } from '@/types/assignments.admin.contract';

const NETWORK_MESSAGE = 'تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.';

/** Arabic message for a failed admin assignments call (spec §9.4). */
export function getAssignmentErrorMessage(error: unknown): string {
  if (!isAssignmentRequestError(error)) return ASSIGNMENT_ERROR_MESSAGES_AR.INTERNAL_ERROR;
  return error.isNetworkError ? NETWORK_MESSAGE : error.userMessage;
}
