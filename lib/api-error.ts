// lib/api-error.ts
import axios from 'axios';
import { API_ERROR_MESSAGES_AR, type ApiErrorBody, type ApiErrorCode } from '@/types/api.contract';

type ErrorResponse = Partial<Omit<ApiErrorBody, 'message'>> & { message?: string | string[] };

function errorBody(error: unknown): ErrorResponse | undefined {
  return axios.isAxiosError<ErrorResponse>(error) ? error.response?.data : undefined;
}

/** The contract error code of a failed request (api.contract.ts), if the server sent one. */
export function getApiErrorCode(error: unknown): ApiErrorCode | undefined {
  const code = errorBody(error)?.code;
  return code && code in API_ERROR_MESSAGES_AR ? (code as ApiErrorCode) : undefined;
}

/** Field -> message for VALIDATION_FAILED (nested fields use dots, e.g. "videoData.playbackUrl"). */
export function getApiErrorDetails(error: unknown): Record<string, string> {
  return errorBody(error)?.details ?? {};
}

/**
 * Human-readable message from an API error. Uses the Arabic text of the contract code
 * when there is one (v1 routes), else NestJS's `message`, which is a string or, for
 * DTO validation failures on older routes such as /auth, a string[].
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<ErrorResponse>(error)) return fallback;
  if (!error.response) return 'تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.';

  const code = getApiErrorCode(error);
  const details = Object.values(getApiErrorDetails(error));
  if (code === 'VALIDATION_FAILED' && details.length) return details.join('، ');
  if (code) return API_ERROR_MESSAGES_AR[code];

  const message = error.response.data?.message;
  if (Array.isArray(message)) return message.join('، ') || fallback;
  return message || fallback;
}
