// app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { FileText, Loader2, Lock, Mail, User } from 'lucide-react';
import { authService, type RegisterCredentials } from '@/services/auth-service';
import { getApiErrorMessage } from '@/lib/api-error';
import { AuthAlert, AuthField } from '@/components/auth/auth-field';

const REDIRECT_DELAY_MS = 2000;

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<Required<RegisterCredentials>>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    bio: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      setSuccessMessage('تم إنشاء حسابك بنجاح! جارٍ تحويلك إلى صفحة الدخول…');
      setTimeout(() => router.push('/login'), REDIRECT_DELAY_MS);
    },
    onError: (err: unknown) => {
      setErrorMessage(getApiErrorMessage(err, 'تعذّر إنشاء الحساب. حاول مرة أخرى.'));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    // Don't send an empty optional bio.
    registerMutation.mutate({ ...formData, bio: formData.bio.trim() || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-start">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">إنشاء حساب جديد</h1>
        <p className="text-sm text-muted-foreground">انضم إلى مجتمع حاضنة TechBox كطالب أو مؤسس شركة ناشئة.</p>
      </div>

      {errorMessage && <AuthAlert tone="error">{errorMessage}</AuthAlert>}
      {successMessage && <AuthAlert tone="success">{successMessage}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <AuthField
            label="الاسم الأول"
            icon={User}
            name="firstName"
            autoComplete="given-name"
            required
            placeholder="عبدالله"
            value={formData.firstName}
            onChange={handleChange}
          />
          <AuthField
            label="اسم العائلة"
            icon={User}
            name="lastName"
            autoComplete="family-name"
            required
            placeholder="اللحام"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        <AuthField
          label="البريد الإلكتروني"
          icon={Mail}
          type="email"
          name="email"
          autoComplete="email"
          dir="ltr"
          required
          placeholder="name@techbox.io"
          value={formData.email}
          onChange={handleChange}
        />

        <AuthField
          label="كلمة المرور"
          icon={Lock}
          type="password"
          name="password"
          autoComplete="new-password"
          required
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
        />

        <AuthField
          label="نبذة مختصرة (اختياري)"
          icon={FileText}
          name="bio"
          placeholder="مهندس برمجيات ومؤسس شركة ناشئة"
          value={formData.bio}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={registerMutation.isPending || !!successMessage}
          className="flex w-full items-center justify-center rounded-xl bg-gold py-3 text-sm font-bold text-navy-900 shadow-md transition-all hover:bg-gold/90 disabled:opacity-50"
        >
          {registerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إنشاء الحساب'}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="font-semibold text-gold hover:underline">
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
