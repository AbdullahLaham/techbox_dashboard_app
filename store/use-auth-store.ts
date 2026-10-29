// store/use-auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSession } from '@/types';
import { AUTH_COOKIE, ROLE_COOKIE } from '@/lib/auth/rbac';

// The access token lasts ~15 min but is refreshed silently; the session ends with the
// refresh token (backend JWT_REFRESH_EXPIRATION_DAYS, default 30 days).
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const TOKEN_STORAGE_KEY = 'access_token';

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

interface AuthState {
  user: UserSession | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** True once persisted state has been restored on the client. */
  hasHydrated: boolean;
  /** `refreshToken` is omitted when only the user changed (e.g. /auth/me sync); the current one is kept. */
  setAuth: (user: UserSession, accessToken: string, refreshToken?: string) => void;
  /** New pair from POST /auth/refresh (the refresh token rotates on every call). */
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
          // Mirrored into cookies so `proxy.ts` can gate routes before render.
          writeCookie(AUTH_COOKIE, accessToken, SESSION_MAX_AGE);
          writeCookie(ROLE_COOKIE, user.globalRole, SESSION_MAX_AGE);
        }
        set({ user, accessToken, refreshToken: refreshToken ?? get().refreshToken });
      },
      setTokens: (accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
          writeCookie(AUTH_COOKIE, accessToken, SESSION_MAX_AGE);
        }
        set({ accessToken, refreshToken });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          writeCookie(AUTH_COOKIE, '', 0);
          writeCookie(ROLE_COOKIE, '', 0);
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'techbox-auth-storage',
      partialize: ({ user, accessToken, refreshToken }) => ({ user, accessToken, refreshToken }),
      // Rehydrated explicitly by AuthGuardProvider after mount, so the server render and
      // the first client render agree (no hydration mismatch on user-dependent UI).
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);
