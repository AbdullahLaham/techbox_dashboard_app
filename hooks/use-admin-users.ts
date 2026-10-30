// hooks/use-admin-users.ts
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { usersAdminApi } from '@/services/users-admin-service';
import type {
  AdminUserDetail,
  AdminUserList,
  AdminUserListItem,
  AdminUserListQuery,
  ChangeUserStatusBody,
  CreateUserBody,
  GlobalRole,
  UpdateUserBody,
} from '@/types/api.contract';

export const adminUserKeys = {
  all: ['admin-users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (query: AdminUserListQuery) => [...adminUserKeys.lists(), query] as const,
  detail: (id: string) => [...adminUserKeys.all, 'detail', id] as const,
};

/* ---------------------------------- Reads --------------------------------- */

/** Keeps the previous page on screen while the next one loads. */
export function useAdminUsers(query: AdminUserListQuery) {
  return useQuery({
    queryKey: adminUserKeys.list(query),
    queryFn: ({ signal }) => usersAdminApi.list(query, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: adminUserKeys.detail(id ?? ''),
    queryFn: ({ signal }) => usersAdminApi.get(id as string, signal),
    enabled: !!id,
    // Sessions and last-seen change often; always show the current state when opened.
    staleTime: 0,
  });
}

/* --------------------------------- Writes --------------------------------- */

/**
 * After a write: the returned user replaces the detail and its row right away, then the
 * lists are refetched (tab counts, filters and sort may have changed).
 */
function applyUser(qc: QueryClient, user: AdminUserDetail) {
  qc.setQueryData(adminUserKeys.detail(user.id), user);
  qc.setQueriesData<AdminUserList>({ queryKey: adminUserKeys.lists() }, (old) =>
    old ? { ...old, items: old.items.map((item) => (item.id === user.id ? pickListFields(user) : item)) } : old,
  );
  return qc.invalidateQueries({ queryKey: adminUserKeys.lists() });
}

function pickListFields(user: AdminUserDetail): AdminUserListItem {
  return {
    id: user.id,
    email: user.email,
    globalRole: user.globalRole,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt,
    canManage: user.canManage,
  };
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateUserBody) => usersAdminApi.create(body),
    onSuccess: (user) => applyUser(qc, user),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateUserBody) => usersAdminApi.update(id, body),
    onSuccess: (user) => applyUser(qc, user),
  });
}

export function useChangeUserRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: GlobalRole) => usersAdminApi.changeRole(id, role),
    onSuccess: (user) => applyUser(qc, user),
  });
}

export function useChangeUserStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ChangeUserStatusBody['status']) => usersAdminApi.changeStatus(id, status),
    onSuccess: (user) => applyUser(qc, user),
  });
}

export function useResetUserPassword(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => usersAdminApi.resetPassword(id, password),
    // activeSessions drops to 0.
    onSuccess: () => qc.invalidateQueries({ queryKey: adminUserKeys.detail(id) }),
  });
}
