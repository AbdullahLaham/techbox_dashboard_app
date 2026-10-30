// components/users/admin/user-panel.tsx
'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Archive, KeyRound, Loader2, PauseCircle, PlayCircle, Save, ShieldAlert, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserAvatar } from '@/components/layout/user-avatar';
import {
  useAdminUser,
  useChangeUserRole,
  useChangeUserStatus,
  useResetUserPassword,
  useUpdateUser,
} from '@/hooks/use-admin-users';
import { useLogout, useSession } from '@/hooks/use-session';
import { getApiErrorCode, getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import { formatDateTime } from '@/lib/assignment-format';
import { formatNumber, formatRelative } from '@/lib/format';
import { assignableRoles, validateName, validatePassword, validatePhone } from '@/lib/users';
import {
  ROLE_LABELS_AR,
  SETTABLE_USER_STATUSES,
  type AdminUserDetail,
  type ChangeUserStatusBody,
  type GlobalRole,
} from '@/types/api.contract';
import { FormField, PasswordInput, RoleBadge, UserStatusBadge, inputClass } from './user-parts';

type SettableStatus = ChangeUserStatusBody['status'];

const STATUS_ACTIONS: Record<SettableStatus, { label: string; icon: typeof PlayCircle; className: string; confirm: string; tone: 'default' | 'danger' }> = {
  ACTIVE: {
    label: 'إعادة التفعيل',
    icon: PlayCircle,
    className: 'bg-emerald-600 text-white hover:bg-emerald-700',
    confirm: 'سيتمكن من تسجيل الدخول مجدداً بكلمة مروره الحالية.',
    tone: 'default',
  },
  SUSPENDED: {
    label: 'إيقاف مؤقت',
    icon: PauseCircle,
    className: 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400',
    confirm: 'سيتم تسجيل خروجه من جميع الأجهزة ولن يتمكن من الدخول حتى إعادة التفعيل. بياناته محفوظة.',
    tone: 'danger',
  },
  ARCHIVED: {
    label: 'أرشفة',
    icon: Archive,
    className: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
    confirm: 'للأشخاص الذين غادروا: سيتم تسجيل خروجه من جميع الأجهزة ولن يتمكن من الدخول. تبقى تسجيلاته وتسليماته ودرجاته محفوظة، ويمكن إعادة تفعيله لاحقاً.',
    tone: 'danger',
  },
};

interface UserPanelProps {
  userId: string | null;
  onClose: () => void;
}

export function UserPanel({ userId, onClose }: UserPanelProps) {
  if (!userId) return null;
  return <Panel key={userId} userId={userId} onClose={onClose} />;
}

function Panel({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, isPending, isError, error, refetch } = useAdminUser(userId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Dialogs opened from the panel handle Escape themselves.
      if (e.key === 'Escape' && !document.querySelector('[role="alertdialog"]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-start bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="تفاصيل الحساب"
        className="h-full w-full max-w-md space-y-6 overflow-y-auto border-l bg-card p-6 text-right shadow-2xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">تفاصيل الحساب</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isPending ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : isError ? (
          getApiErrorCode(error) === 'NOT_FOUND' ? (
            <p className="text-sm text-muted-foreground">هذا الحساب غير موجود.</p>
          ) : (
            <p className="text-sm text-destructive">
              تعذّر تحميل الحساب.{' '}
              <button type="button" onClick={() => void refetch()} className="underline">
                إعادة المحاولة
              </button>
            </p>
          )
        ) : (
          <UserDetails user={data} />
        )}
      </aside>
    </div>
  );
}

function UserDetails({ user }: { user: AdminUserDetail }) {
  const { user: me, role: myRole } = useSession();
  const isSelf = me?.id === user.id;
  // The API allows editing your own name and phone and resetting your own password,
  // but never changing your own role or status (canManage is false for yourself).
  const canEditProfile = user.canManage || isSelf;
  const canChangeAccess = user.canManage && !isSelf;
  const initials = (user.displayName.trim()[0] ?? user.email[0] ?? '؟').toUpperCase();

  return (
    <>
      <div className="flex items-center gap-3">
        <UserAvatar initials={initials} src={user.avatarUrl ?? undefined} alt={user.displayName} />
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-bold text-foreground">
            {user.displayName} {isSelf && <span className="text-[11px] font-semibold text-gold">(أنت)</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground" dir="ltr" style={{ textAlign: 'right' }}>
            {user.email}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <RoleBadge role={user.globalRole} />
            <UserStatusBadge status={user.status} />
          </div>
        </div>
      </div>

      {!canEditProfile && (
        <p className="flex items-start gap-2 rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          يمكنك عرض هذا الحساب فقط؛ إدارة هذا الدور من صلاحية مدير النظام.
        </p>
      )}

      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 rounded-2xl border bg-muted/20 p-4 text-xs">
        <Info label="الهاتف" value={user.phoneNumber} ltr />
        <Info label="الواتساب" value={user.profile.phoneWhatsApp} ltr />
        <Info label="الاسم بالعربية" value={user.profile.fullNameAr} />
        <Info label="الاسم بالإنجليزية" value={user.profile.fullNameEn} ltr />
        <Info label="المحافظة" value={user.profile.governorate} />
        <Info label="العمر" value={user.profile.age === null ? null : String(user.profile.age)} />
        <Info label="تاريخ الإنشاء" value={formatDateTime(user.createdAt)} />
        <Info label="آخر ظهور" value={user.lastSeenAt ? formatRelative(user.lastSeenAt) : 'لم يسجّل الدخول بعد'} />
        <Info label="الأجهزة المتصلة" value={formatNumber(user.activeSessions)} />
      </dl>

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="التسجيلات" value={`${formatNumber(user.stats.enrollments)} (${formatNumber(user.stats.activeEnrollments)} نشط)`} />
        <Stat label="التسليمات" value={formatNumber(user.stats.submissions)} />
        <Stat label="محاولات الاختبارات" value={formatNumber(user.stats.quizAttempts)} />
        <Stat label="تسليمات قيّمها" value={formatNumber(user.stats.gradedSubmissions)} />
      </dl>

      {canEditProfile && <ProfileForm user={user} isSelf={isSelf} />}
      {canChangeAccess && <RoleSection user={user} roles={assignableRoles(myRole)} />}
      {canChangeAccess && <StatusSection user={user} />}
      {isSelf && !user.canManage && (
        <p className="text-[11px] text-muted-foreground">لا يمكنك تغيير دور أو حالة حسابك بنفسك.</p>
      )}
      {canEditProfile && <PasswordSection user={user} isSelf={isSelf} />}
    </>
  );
}

/* --------------------------------- Profile -------------------------------- */

type ProfileField = 'firstName' | 'lastName' | 'phoneNumber';

function ProfileForm({ user, isSelf }: { user: AdminUserDetail; isSelf: boolean }) {
  const qc = useQueryClient();
  const update = useUpdateUser(user.id);
  const initial = { firstName: user.firstName ?? '', lastName: user.lastName ?? '', phoneNumber: user.phoneNumber ?? '' };
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<ProfileField, string>>>({});
  const [saved, setSaved] = useState(false);

  const changed = (Object.keys(initial) as ProfileField[]).filter((f) => values[f].trim() !== initial[f].trim());

  const set = (field: ProfileField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setSaved(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = Object.fromEntries(
      Object.entries({
        firstName: validateName(values.firstName, 'الاسم الأول'),
        lastName: validateName(values.lastName, 'اسم العائلة'),
        phoneNumber: validatePhone(values.phoneNumber),
      }).filter(([, m]) => m),
    );
    setErrors(found);
    if (Object.keys(found).length > 0 || changed.length === 0) return;

    const body: { firstName?: string; lastName?: string; phoneNumber?: string | null } = {};
    if (changed.includes('firstName')) body.firstName = values.firstName.trim();
    if (changed.includes('lastName')) body.lastName = values.lastName.trim();
    if (changed.includes('phoneNumber')) body.phoneNumber = values.phoneNumber.trim() || null;

    update.mutate(body, {
      onSuccess: (updated) => {
        setValues({ firstName: updated.firstName ?? '', lastName: updated.lastName ?? '', phoneNumber: updated.phoneNumber ?? '' });
        setSaved(true);
        // Your own name also shows in the header (the session is ["auth-me", token]).
        if (isSelf) void qc.invalidateQueries({ queryKey: ['auth-me'] });
      },
      onError: (error) => {
        const details = getApiErrorDetails(error);
        const next: Partial<Record<ProfileField, string>> = {};
        for (const f of ['firstName', 'lastName', 'phoneNumber'] as const) if (details[f]) next[f] = details[f];
        if (getApiErrorCode(error) === 'PHONE_TAKEN') next.phoneNumber ??= getApiErrorMessage(error, '');
        setErrors(next);
      },
    });
  };

  const fieldErrorShown = Object.values(errors).some(Boolean);

  return (
    <form onSubmit={submit} noValidate className="space-y-3 border-t pt-5">
      <h3 className="text-xs font-bold text-foreground">البيانات الأساسية</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="الاسم الأول" error={errors.firstName}>
          {({ id, describedBy, invalid }) => (
            <input id={id} value={values.firstName} onChange={(e) => set('firstName', e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} className={inputClass} />
          )}
        </FormField>
        <FormField label="اسم العائلة" error={errors.lastName}>
          {({ id, describedBy, invalid }) => (
            <input id={id} value={values.lastName} onChange={(e) => set('lastName', e.target.value)} aria-describedby={describedBy} aria-invalid={invalid} className={inputClass} />
          )}
        </FormField>
      </div>
      <FormField label="رقم الهاتف" error={errors.phoneNumber} hint="اتركه فارغاً لحذفه.">
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            type="tel"
            dir="ltr"
            value={values.phoneNumber}
            onChange={(e) => set('phoneNumber', e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            className={inputClass}
          />
        )}
      </FormField>
      {update.error && !fieldErrorShown && (
        <p role="alert" className="text-[11px] text-destructive">
          {getApiErrorMessage(update.error, 'تعذّر حفظ البيانات.')}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={update.isPending || changed.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-navy-900 shadow-sm hover:bg-gold/90 disabled:opacity-50"
        >
          {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          حفظ
        </button>
        {saved && changed.length === 0 && <span className="text-[11px] text-emerald-600">تم الحفظ.</span>}
      </div>
    </form>
  );
}

/* ---------------------------------- Role ---------------------------------- */

function RoleSection({ user, roles }: { user: AdminUserDetail; roles: readonly GlobalRole[] }) {
  const change = useChangeUserRole(user.id);
  const [role, setRole] = useState<GlobalRole>(user.globalRole);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-3 border-t pt-5">
      <h3 className="text-xs font-bold text-foreground">الدور</h3>
      <div className="flex gap-2">
        <select
          aria-label="الدور"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as GlobalRole);
            change.reset();
          }}
          className={inputClass}
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS_AR[r]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={role === user.globalRole}
          className="shrink-0 rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-40"
        >
          تغيير الدور
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">يُطبَّق التغيير على الطلب التالي للمستخدم دون الحاجة لإعادة تسجيل الدخول.</p>

      <ConfirmDialog
        open={confirming}
        title="تغيير الدور"
        description={
          <>
            سيصبح دور <strong className="text-foreground">{user.displayName}</strong> «{ROLE_LABELS_AR[role]}» بدلاً من «
            {ROLE_LABELS_AR[user.globalRole]}»، وتتغير صلاحياته فوراً.
          </>
        }
        confirmLabel="تغيير الدور"
        pending={change.isPending}
        error={change.error ? getApiErrorMessage(change.error, 'تعذّر تغيير الدور.') : null}
        onConfirm={() => change.mutate(role, { onSuccess: () => setConfirming(false) })}
        onClose={() => {
          setConfirming(false);
          change.reset();
        }}
      />
    </div>
  );
}

/* --------------------------------- Status --------------------------------- */

function StatusSection({ user }: { user: AdminUserDetail }) {
  const change = useChangeUserStatus(user.id);
  const [target, setTarget] = useState<SettableStatus | null>(null);
  const targets = SETTABLE_USER_STATUSES.filter((s): s is SettableStatus => s !== user.status && s !== 'PENDING');

  return (
    <div className="space-y-3 border-t pt-5">
      <h3 className="text-xs font-bold text-foreground">حالة الحساب</h3>
      <div className="flex flex-wrap gap-2">
        {targets.map((status) => {
          const { label, icon: Icon, className } = STATUS_ACTIONS[status];
          return (
            <button
              key={status}
              type="button"
              onClick={() => setTarget(status)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${className}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        open={target !== null}
        title={target ? `${STATUS_ACTIONS[target].label}: ${user.displayName}` : ''}
        description={target ? STATUS_ACTIONS[target].confirm : ''}
        confirmLabel={target ? STATUS_ACTIONS[target].label : ''}
        tone={target ? STATUS_ACTIONS[target].tone : 'default'}
        pending={change.isPending}
        error={change.error ? getApiErrorMessage(change.error, 'تعذّر تغيير الحالة.') : null}
        onConfirm={() => target && change.mutate(target, { onSuccess: () => setTarget(null) })}
        onClose={() => {
          setTarget(null);
          change.reset();
        }}
      />
    </div>
  );
}

/* -------------------------------- Password -------------------------------- */

function PasswordSection({ user, isSelf }: { user: AdminUserDetail; isSelf: boolean }) {
  const reset = useResetUserPassword(user.id);
  const logout = useLogout();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const ask = () => {
    const problem = validatePassword(password);
    setError(problem);
    if (!problem) setConfirming(true);
  };

  return (
    <div className="space-y-3 border-t pt-5">
      <h3 className="text-xs font-bold text-foreground">إعادة تعيين كلمة المرور</h3>
      <FormField label="كلمة المرور الجديدة" error={error} hint={done ? undefined : 'شاركها مع صاحب الحساب بطريقة آمنة.'}>
        {({ id, describedBy, invalid }) => (
          <PasswordInput
            id={id}
            value={password}
            onChange={(v) => {
              setPassword(v);
              setError(undefined);
              setDone(false);
            }}
            describedBy={describedBy}
            invalid={invalid}
          />
        )}
      </FormField>
      {done && (
        <p role="status" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-800 dark:text-emerald-300">
          تم تعيين كلمة المرور الجديدة وتسجيل خروجه من جميع الأجهزة. انسخها الآن وشاركها معه.
        </p>
      )}
      <button
        type="button"
        onClick={ask}
        disabled={!password}
        className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-40"
      >
        <KeyRound className="h-3.5 w-3.5" /> تعيين كلمة المرور
      </button>

      <ConfirmDialog
        open={confirming}
        title="إعادة تعيين كلمة المرور"
        description={
          isSelf
            ? 'ستُستبدل كلمة مرورك ويتم تسجيل خروجك من جميع الأجهزة، بما فيها هذا الجهاز. سجّل الدخول بعدها بكلمة المرور الجديدة.'
            : `ستُستبدل كلمة مرور ${user.displayName} ويتم تسجيل خروجه من جميع الأجهزة (${formatNumber(user.activeSessions)} متصل الآن).`
        }
        confirmLabel="تعيين كلمة المرور"
        tone="danger"
        pending={reset.isPending}
        error={reset.error ? getApiErrorMessage(reset.error, 'تعذّر تعيين كلمة المرور.') : null}
        onConfirm={() =>
          reset.mutate(password, {
            onSuccess: () => {
              setConfirming(false);
              // Your own sessions were just revoked: sign out cleanly instead of failing on the next request.
              if (isSelf) logout();
              else setDone(true);
            },
          })
        }
        onClose={() => {
          setConfirming(false);
          reset.reset();
        }}
      />
    </div>
  );
}

/* --------------------------------- Shared --------------------------------- */

function Info({ label, value, ltr }: { label: string; value: string | null; ltr?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="col-span-2 font-semibold text-foreground" dir={ltr ? 'ltr' : undefined} style={ltr ? { textAlign: 'right' } : undefined}>
        {value || '—'}
      </dd>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-bold text-foreground tabular-nums">
        <bdi>{value}</bdi>
      </dd>
    </div>
  );
}
