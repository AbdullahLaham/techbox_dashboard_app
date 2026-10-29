// lib/api.ts
// The configured axios instance (API origin as baseURL, Bearer interceptor, 401 → logout),
// exposed under the name the assignments spec (§19.1) expects.
export { apiClient as api } from '@/services/auth-service';
