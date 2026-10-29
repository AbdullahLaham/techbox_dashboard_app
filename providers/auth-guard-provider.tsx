// providers/auth-guard-provider.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { authService } from '@/services/auth-service';
import { useAuthStore } from '@/store/use-auth-store';
import {
  REDIRECT_PARAM,
  getSafeRedirect,
  isAuthRoute,
  isProtectedRoute,
  resolveRouteAccess,
} from '@/lib/auth/rbac';
import { OfflineBanner, SessionErrorScreen, SessionLoadingScreen } from '@/components/layout/session-screen';

const OFFLINE_RETRY_MS = 15_000;

/** Keyed by token so a new sign-in never reuses the previous user's cached profile. */
export const authMeQueryKey = (token: string | null) => ['auth-me', token] as const;

function isAuthFailure(error: unknown): boolean {
  return axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
}

type SessionStatus = 'pending' | 'anonymous' | 'authenticated' | 'unreachable';

/**
 * Second enforcement layer behind `proxy.ts`. The proxy trusts cookies; this guard
 * trusts only the role returned by `/auth/me`, so a tampered `user_role` cookie
 * cannot unlock a page here.
 */
export default function AuthGuardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const persistedUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  const session = useQuery({
    queryKey: authMeQueryKey(accessToken),
    queryFn: authService.getCurrentUser,
    enabled: hasHydrated && !!accessToken,
    retry: (failureCount, error) => !isAuthFailure(error) && failureCount < 2,
    staleTime: 1000 * 60 * 5,
    // A silent token refresh changes the key; keep the verified user meanwhile instead of
    // flashing the session loading screen. (A new sign-in seeds its own key on login.)
    placeholderData: keepPreviousData,
    // While the backend is unreachable, keep probing so the app recovers on its own.
    refetchInterval: (query) =>
      query.state.status === 'error' && !isAuthFailure(query.state.error) ? OFFLINE_RETRY_MS : false,
  });

  const verifiedUser = session.data;
  const authFailed = session.isError && isAuthFailure(session.error);

  let status: SessionStatus;
  if (!hasHydrated) status = 'pending';
  else if (!accessToken || authFailed) status = 'anonymous';
  else if (session.isPending) status = 'pending';
  else if (session.isError) status = 'unreachable';
  else status = 'authenticated';

  // Backend down but we hold a previously verified session: keep working with the saved
  // role (same trust level as the cookie the proxy already used) instead of locking the
  // user out. The API still authorizes every request on its own.
  const offline = status === 'unreachable' && !!persistedUser;
  const sessionUser = verifiedUser ?? (offline ? persistedUser : null);
  if (offline) status = 'authenticated';

  // Keep store + cookies in sync with the server's view of the user (role changes, profile edits).
  useEffect(() => {
    if (verifiedUser && accessToken) setAuth(verifiedUser, accessToken);
  }, [verifiedUser, accessToken, setAuth]);

  useEffect(() => {
    if (authFailed) logout();
  }, [authFailed, logout]);

  const search = searchParams.toString();
  const currentUrl = search ? `${pathname}?${search}` : pathname;
  const role = status === 'authenticated' ? (sessionUser?.globalRole ?? null) : null;

  let redirectTo: string | null = null;
  if (status === 'authenticated' || status === 'anonymous') {
    const decision = resolveRouteAccess(pathname, { authenticated: status === 'authenticated', role }, currentUrl);
    if (decision.type !== 'allow') {
      // Coming back from the login page: honour a validated `?redirect=` target.
      redirectTo =
        decision.type === 'home' && role && isAuthRoute(pathname)
          ? getSafeRedirect(searchParams.get(REDIRECT_PARAM), role)
          : decision.redirectTo;
    }
  }

  useEffect(() => {
    if (redirectTo && redirectTo !== currentUrl) router.replace(redirectTo);
  }, [redirectTo, currentUrl, router]);

  // Pages that need a verdict before rendering; public pages render immediately.
  const gated = isProtectedRoute(pathname) || pathname === '/' || (isAuthRoute(pathname) && !!accessToken);

  if (redirectTo) return <SessionLoadingScreen label="جارٍ تحويلك…" />;
  if (gated && status === 'pending') return <SessionLoadingScreen />;
  if (gated && status === 'unreachable') return <SessionErrorScreen onRetry={() => void session.refetch()} />;

  return (
    <>
      {offline && <OfflineBanner retrying={session.isFetching} onRetry={() => void session.refetch()} />}
      {children}
    </>
  );
}
