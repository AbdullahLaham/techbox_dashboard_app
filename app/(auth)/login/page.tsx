// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Lock, Mail } from 'lucide-react';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/store/use-auth-store';
import { authMeQueryKey } from '@/providers/auth-guard-provider';
import { getApiErrorMessage } from '@/lib/api-error';
import { AuthAlert, AuthField } from '@/components/auth/auth-field';

export default function LoginPage() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      // Seed the verified-session cache so AuthGuardProvider skips a /auth/me round-trip,
      // then persist the session. The guard performs the role-aware redirect
      // (honouring a validated ?redirect= param).
      queryClient.setQueryData(authMeQueryKey(data.accessToken), data.user);
      setAuth(data.user, data.accessToken, data.refreshToken);
    },
    onError: (err: unknown) => {
      setErrorMessage(getApiErrorMessage(err, 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center lg:text-start">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">مرحباً بعودتك</h1>
        <p className="text-sm text-muted-foreground">أدخل بيانات حسابك للوصول إلى مساحة عملك في TechBox.</p>
      </div>

      {errorMessage && <AuthAlert tone="error">{errorMessage}</AuthAlert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="البريد الإلكتروني"
          icon={Mail}
          type="email"
          autoComplete="email"
          dir="ltr"
          required
          placeholder="name@techbox.io"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthField
          label="كلمة المرور"
          icon={Lock}
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {loginMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              تسجيل الدخول <ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-semibold text-gold hover:underline">
          أنشئ حساباً جديداً
        </Link>
      </div>
    </div>
  );
}
