// components/users/admin/create-user-dialog.tsx
'use client';

import { useEffect, useId, useState } from 'react';
import { CheckCircle2, Loader2, UserPlus, X } from 'lucide-react';
import { useCreateUser } from '@/hooks/use-admin-users';
import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { validateEmail, validateName, validatePassword, validatePhone } from '@/lib/users';
import { ROLE_LABELS_AR, type AdminUserDetail, type GlobalRole } from '@/types/api.contract';
import { FormField, PasswordInput, RoleBadge, inputClass } from './user-parts';

type Field = 'firstName' | 'lastName' | 'email' | 'role' | 'phoneNumber' | 'password';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

function validate(v: Values): Errors {
  const errors: Errors = {
    firstName: validateName(v.firstName, 'الاسم الأول'),
    lastName: validateName(v.lastName, 'اسم العائلة'),
    email: validateEmail(v.email),
    phoneNumber: validatePhone(v.phoneNumber),
    password: validatePassword(v.password),
    role: v.role ? undefined : 'اختر الدور.',
  };
  return Object.fromEntries(Object.entries(errors).filter(([, m]) => m)) as Errors;
}

/** Server refusals mapped to the field they concern. */
function serverErrors(error: unknown): Errors {
  const details = getApiErrorDetails(error);
  const errors: Errors = {};
  for (const field of ['firstName', 'lastName', 'email', 'role', 'phoneNumber', 'password'] as const) {
    if (details[field]) errors[field] = details[field];
  }
  const code = getApiErrorCode(error);
  if (code === 'EMAIL_TAKEN') errors.email ??= getApiErrorMessage(error, '');
  if (code === 'PHONE_TAKEN') errors.phoneNumber ??= getApiErrorMessage(error, '');
  return errors;
}

interface CreateUserDialogProps {
  open: boolean;
  /** Roles the caller may create (MANAGEABLE_ROLES of their role). */
  roles: readonly GlobalRole[];
  onClose: () => void;
  /** Opens the new account's panel. */
  onOpenUser: (id: string) => void;
}

export function CreateUserDialog({ open, ...props }: CreateUserDialogProps) {
  // Mounted only while open, so every opening starts from an empty form.
  return open ? <Dialog {...props} /> : null;
}

function Dialog({ roles, onClose, onOpenUser }: Omit<CreateUserDialogProps, 'open'>) {
  const titleId = useId();
  const create = useCreateUser();
  const [values, setValues] = useState<Values>({
    firstName: '',
    lastName: '',
    email: '',
    role: roles.includes('INSTRUCTOR') ? 'INSTRUCTOR' : (roles[0] ?? ''),
    phoneNumber: '',
    password: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [created, setCreated] = useState<{ user: AdminUserDetail; password: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !create.isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [create.isPending, onClose]);

  const set = (field: Field) => (value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    create.mutate(
      {
        email: values.email.trim(),
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        role: values.role as GlobalRole,
        phoneNumber: values.phoneNumber.trim() || undefined,
      },
      {
        onSuccess: (user) => setCreated({ user, password: values.password }),
        onError: (error) => setErrors(serverErrors(error)),
      },
    );
  };

  const fieldErrorShown = Object.values(errors).some(Boolean);
  const generalError = create.error && !fieldErrorShown ? getApiErrorMessage(create.error, 'تعذّر إنشاء الحساب.') : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => !create.isPending && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg space-y-5 overflow-y-auto rounded-3xl border bg-card p-6 text-right shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={create.isPending}
          aria-label="إغلاق"
          className="absolute top-4 left-4 rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id={titleId} className="flex items-center gap-2 text-base font-bold text-foreground">
          <UserPlus className="h-5 w-5 text-gold" /> {created ? 'تم إنشاء الحساب' : 'إضافة مستخدم'}
        </h2>

        {created ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>الحساب نشط ويمكن تسجيل الدخول به الآن. شارك كلمة المرور مع صاحبها بطريقة آمنة؛ لن تظهر مرة أخرى.</p>
            </div>
            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 rounded-2xl border bg-muted/20 p-4 text-xs">
              <dt className="text-muted-foreground">الاسم</dt>
              <dd className="col-span-2 font-semibold">{created.user.displayName}</dd>
              <dt className="text-muted-foreground">الدور</dt>
              <dd className="col-span-2">
                <RoleBadge role={created.user.globalRole} />
              </dd>
              <dt className="text-muted-foreground">البريد</dt>
              <dd className="col-span-2 font-semibold" dir="ltr" style={{ textAlign: 'right' }}>
                {created.user.email}
              </dd>
            </dl>
            <FormField label="كلمة المرور المؤقتة">
              {({ id }) => <PasswordInput id={id} value={created.password} readOnly />}
            </FormField>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted">
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => onOpenUser(created.user.id)}
                className="rounded-xl bg-gold px-5 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90"
              >
                فتح الحساب
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="الاسم الأول" error={errors.firstName}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} value={values.firstName} onChange={(e) => set('firstName')(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} className={inputClass} />
                )}
              </FormField>
              <FormField label="اسم العائلة" error={errors.lastName}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} value={values.lastName} onChange={(e) => set('lastName')(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} className={inputClass} />
                )}
              </FormField>
            </div>

            <FormField label="البريد الإلكتروني" error={errors.email}>
              {({ id, describedBy, invalid }) => (
                <input
                  id={id}
                  type="email"
                  dir="ltr"
                  autoComplete="off"
                  value={values.email}
                  onChange={(e) => set('email')(e.target.value)}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  className={inputClass}
                />
              )}
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="الدور" error={errors.role}>
                {({ id, describedBy, invalid }) => (
                  <select id={id} value={values.role} onChange={(e) => set('role')(e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} className={inputClass}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS_AR[role]}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
              <FormField label="رقم الهاتف (اختياري)" error={errors.phoneNumber}>
                {({ id, describedBy, invalid }) => (
                  <input
                    id={id}
                    type="tel"
                    dir="ltr"
                    value={values.phoneNumber}
                    onChange={(e) => set('phoneNumber')(e.target.value)}
                    placeholder="+970599000000"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className={inputClass}
                  />
                )}
              </FormField>
            </div>

            <FormField label="كلمة المرور المؤقتة" error={errors.password} hint="8 أحرف على الأقل. يسجّل صاحب الحساب الدخول بها مباشرة.">
              {({ id, describedBy, invalid }) => (
                <PasswordInput id={id} value={values.password} onChange={set('password')} describedBy={describedBy} invalid={invalid} />
              )}
            </FormField>

            {generalError && (
              <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                {generalError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={onClose} disabled={create.isPending} className="rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50">
                إلغاء
              </button>
              <button
                type="submit"
                disabled={create.isPending}
                className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2 text-xs font-bold text-navy-900 shadow-md hover:bg-gold/90 disabled:opacity-50"
              >
                {create.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                إنشاء الحساب
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
