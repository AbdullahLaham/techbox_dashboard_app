// hooks/use-session.ts
'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/use-auth-store';
import { authService } from '@/services/auth-service';
import { ROLE_LABELS, isStaffRole } from '@/lib/auth/rbac';
import type { GlobalRole, UserSession } from '@/types';

export interface SessionView {
  user: UserSession | null;
  role: GlobalRole | null;
  roleLabel: string;
  isStaff: boolean;
  displayName: string;
  initials: string;
}

function getInitials(user: UserSession | null): string {
  if (!user) return '؟';
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  if (parts.length === 0) return user.email[0]?.toUpperCase() ?? '؟';
  return parts.map((p) => p[0]).join('').slice(0, 2);
}

/** Read-only view of the current user for UI. Access control lives in AuthGuardProvider. */
export function useSession(): SessionView {
  const user = useAuthStore((s) => s.user);
  const role = user?.globalRole ?? null;

  return {
    user,
    role,
    roleLabel: role ? ROLE_LABELS[role] : 'زائر المنصة',
    isStaff: isStaffRole(role),
    displayName: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email : 'زائر',
    initials: getInitials(user),
  };
}

/** Clears the session and every cached query; AuthGuardProvider handles the redirect. */
export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return useCallback(() => {
    const { refreshToken } = useAuthStore.getState();
    // Clear locally first so logout never waits on the network.
    logout();
    queryClient.clear();
    if (refreshToken) {
      authService.logout(refreshToken).catch(() => {
        // The server session expires on its own if revocation fails.
      });
    }
  }, [logout, queryClient]);
}
