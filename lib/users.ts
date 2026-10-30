// lib/users.ts
// Helpers for /admin/users (types/api.contract.ts, "User management").
import { MANAGEABLE_ROLES, USER_LIMITS, type GlobalRole, type UserStatus } from '@/types/api.contract';

/** Roles the caller may assign or manage: empty for anyone who is not a user manager. */
export function assignableRoles(callerRole: GlobalRole | null | undefined): readonly GlobalRole[] {
  return callerRole === 'SUPER_ADMIN' || callerRole === 'INCUBATOR_MANAGER' ? MANAGEABLE_ROLES[callerRole] : [];
}

export const ROLE_BADGE_VARIANT: Record<GlobalRole, 'navy' | 'gold' | 'success' | 'warning' | 'muted'> = {
  SUPER_ADMIN: 'navy',
  INCUBATOR_MANAGER: 'gold',
  INSTRUCTOR: 'success',
  MENTOR: 'success',
  STUDENT: 'muted',
  GUEST: 'muted',
};

export const USER_STATUS_BADGE_VARIANT: Record<UserStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'danger',
  ARCHIVED: 'muted',
};

/* -------------------------------- Passwords ------------------------------- */

// No look-alike characters (0/O, 1/l/I), so a password read out or copied by hand still works.
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A random temporary password (crypto-strength), well above the 8-character minimum. */
export function generatePassword(length = 14): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => PASSWORD_ALPHABET[n % PASSWORD_ALPHABET.length]).join('');
}

export function validatePassword(value: string): string | undefined {
  if (value.length < USER_LIMITS.passwordMin) return `كلمة المرور ${USER_LIMITS.passwordMin} أحرف على الأقل.`;
  if (value.length > USER_LIMITS.passwordMax) return `كلمة المرور ${USER_LIMITS.passwordMax} حرفاً على الأكثر.`;
  return undefined;
}

/* --------------------------------- Fields --------------------------------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'البريد الإلكتروني مطلوب.';
  if (!EMAIL_PATTERN.test(value.trim())) return 'أدخل بريداً إلكترونياً صالحاً.';
  return undefined;
}

export function validateName(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} مطلوب.`;
  if (value.trim().length > USER_LIMITS.nameMax) return `${label} ${USER_LIMITS.nameMax} حرفاً على الأكثر.`;
  return undefined;
}

/** Optional. The server checks uniqueness (409 PHONE_TAKEN). */
export function validatePhone(value: string): string | undefined {
  if (value.trim().length > USER_LIMITS.phoneMax) return `رقم الهاتف ${USER_LIMITS.phoneMax} رمزاً على الأكثر.`;
  return undefined;
}
