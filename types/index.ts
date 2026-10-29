export enum GlobalRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  INCUBATOR_MANAGER = 'INCUBATOR_MANAGER',
  INSTRUCTOR = 'INSTRUCTOR',
  MENTOR = 'MENTOR',
  STUDENT = 'STUDENT',
  GUEST = 'GUEST',
}

export interface UserSession {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  globalRole: GlobalRole;
  avatarUrl?: string;
}

export interface LoginResponse {
  accessToken: string;
  /** Opaque; exchange at POST /auth/refresh. Rotates on every refresh. */
  refreshToken: string;
  user: UserSession;
}

/** POST /auth/refresh */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}