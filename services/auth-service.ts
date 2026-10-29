import axios, { type InternalAxiosRequestConfig } from 'axios';
import { UserSession, LoginResponse, RefreshResponse } from '@/types';
import { TOKEN_STORAGE_KEY, useAuthStore } from '@/store/use-auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// No interceptors, so a failing refresh can never trigger another refresh.
const refreshClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } });

// Credential endpoints answer 401 for bad input, not for an expired access token.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshInFlight: Promise<string> | null = null;

/**
 * Exchange the refresh token for a new pair. Refresh tokens rotate (each works once), so
 * concurrent 401s share one call. A rejected refresh token ends the session; network or
 * server errors keep it so a later attempt can succeed.
 */
function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    const { refreshToken, logout, setTokens } = useAuthStore.getState();
    if (!refreshToken) {
      logout();
      throw new Error('No refresh token');
    }
    try {
      const { data } = await refreshClient.post<RefreshResponse>('/auth/refresh', { refreshToken });
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 401) logout();
      throw error;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

// Automatically inject Bearer token from localStorage if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// On 401, refresh once and replay the request. If the refresh token is rejected the session
// ends and AuthGuardProvider redirects to login.
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) return Promise.reject(error);
    const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const skip =
      error.response?.status !== 401 ||
      !config ||
      config._retried ||
      !useAuthStore.getState().accessToken ||
      NO_REFRESH_PATHS.some((path) => config.url?.startsWith(path));
    if (skip) return Promise.reject(error);

    config._retried = true;
    try {
      const accessToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(config);
    } catch {
      // Surface the original 401 so callers keep the API's error body for messages.
      return Promise.reject(error);
    }
  },
);

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  bio?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async register(credentials: RegisterCredentials) {
    const response = await apiClient.post('/auth/register', credentials);
    return response.data;
  },

    async getCurrentUser(): Promise<UserSession> {
    const response = await apiClient.get<UserSession>('/auth/me');
    return response.data;
  },

  /** Revoke the server session. Best effort: the local session is cleared either way. */
  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};