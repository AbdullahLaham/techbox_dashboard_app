// services/users-admin-service.ts
// Accounts for /admin/users (types/api.contract.ts, "User management"). SUPER_ADMIN and
// INCUBATOR_MANAGER only; what each may change is in MANAGEABLE_ROLES and `canManage`.
import { apiClient } from '@/services/auth-service';
import {
  API_ENDPOINTS,
  type AdminUserDetail,
  type AdminUserList,
  type AdminUserListQuery,
  type ChangeUserStatusBody,
  type CreateUserBody,
  type GlobalRole,
  type UpdateUserBody,
} from '@/types/api.contract';

export const usersAdminApi = {
  async list(query: AdminUserListQuery, signal?: AbortSignal): Promise<AdminUserList> {
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''));
    const res = await apiClient.get<AdminUserList>(API_ENDPOINTS.adminUsers, { params, signal });
    return res.data;
  },

  async get(id: string, signal?: AbortSignal): Promise<AdminUserDetail> {
    const res = await apiClient.get<AdminUserDetail>(API_ENDPOINTS.adminUser(id), { signal });
    return res.data;
  },

  /** The account is ACTIVE and can sign in with `password` at once. */
  async create(body: CreateUserBody): Promise<AdminUserDetail> {
    const res = await apiClient.post<AdminUserDetail>(API_ENDPOINTS.adminUsers, body);
    return res.data;
  },

  /** Name and phone. Allowed on manageable users and on the caller's own account. */
  async update(id: string, body: UpdateUserBody): Promise<AdminUserDetail> {
    const res = await apiClient.patch<AdminUserDetail>(API_ENDPOINTS.adminUser(id), body);
    return res.data;
  },

  /** Applies on the user's next request. Never on yourself (409 CANNOT_MODIFY_SELF). */
  async changeRole(id: string, role: GlobalRole): Promise<AdminUserDetail> {
    const res = await apiClient.patch<AdminUserDetail>(API_ENDPOINTS.adminUserRole(id), { role });
    return res.data;
  },

  /** SUSPENDED and ARCHIVED sign the user out on every device. */
  async changeStatus(id: string, status: ChangeUserStatusBody['status']): Promise<AdminUserDetail> {
    const res = await apiClient.patch<AdminUserDetail>(API_ENDPOINTS.adminUserStatus(id), { status });
    return res.data;
  },

  /** 204. Every session of that user is revoked (yours too, when resetting your own). */
  async resetPassword(id: string, password: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.adminUserPassword(id), { password });
  },
};
