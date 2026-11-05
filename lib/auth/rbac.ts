// lib/auth/rbac.ts
// Single source of truth for role-based access control.
// Pure and dependency-free so it can run in both `proxy.ts` (server) and client components.
import { GlobalRole } from '@/types';

export const AUTH_COOKIE = 'access_token';
export const ROLE_COOKIE = 'user_role';
export const REDIRECT_PARAM = 'redirect';

export const LOGIN_ROUTE = '/login';

/** Roles that operate the platform (admin portal). */
export const STAFF_ROLES = [
  GlobalRole.SUPER_ADMIN,
  GlobalRole.INCUBATOR_MANAGER,
  GlobalRole.INSTRUCTOR,
  GlobalRole.MENTOR,
] as const satisfies readonly GlobalRole[];

/** Roles that consume the platform (client portal). */
export const LEARNER_ROLES = [GlobalRole.STUDENT, GlobalRole.GUEST] as const satisfies readonly GlobalRole[];

export const ALL_ROLES = [...STAFF_ROLES, ...LEARNER_ROLES] as const;

/**
 * Roles allowed to manage assignments (assignments spec §4.5, decision R1). Instructors and mentors
 * stay out until the backend can scope staff to programs. Must match the backend's list.
 */
export const ASSIGNMENT_MANAGER_ROLES = [
  GlobalRole.SUPER_ADMIN,
  GlobalRole.INCUBATOR_MANAGER,
] as const satisfies readonly GlobalRole[];

/** Roles allowed to create and edit lessons and quizzes and review quiz attempts. Must match CONTENT_MANAGER_ROLES in the API contract. */
export const CONTENT_MANAGER_ROLES = [
  GlobalRole.SUPER_ADMIN,
  GlobalRole.INCUBATOR_MANAGER,
  GlobalRole.INSTRUCTOR,
] as const satisfies readonly GlobalRole[];

/** Roles allowed to delete curriculum content. Must match CONTENT_OWNER_ROLES in the API contract. */
export const CONTENT_OWNER_ROLES = [
  GlobalRole.SUPER_ADMIN,
  GlobalRole.INCUBATOR_MANAGER,
] as const satisfies readonly GlobalRole[];

/** Roles allowed to review and grade assignment hand-ins. Must match SUBMISSION_REVIEWER_ROLES in the API contract. */
export const SUBMISSION_REVIEWER_ROLES = [
  GlobalRole.SUPER_ADMIN,
  GlobalRole.INCUBATOR_MANAGER,
  GlobalRole.INSTRUCTOR,
] as const satisfies readonly GlobalRole[];

/** Roles allowed to review enrollment applications. Must match ENROLLMENT_MANAGER_ROLES in the API contract. */
export const ENROLLMENT_MANAGER_ROLES = [
  GlobalRole.SUPER_ADMIN,
  GlobalRole.INCUBATOR_MANAGER,
] as const satisfies readonly GlobalRole[];

export const ROLE_LABELS: Record<GlobalRole, string> = {
  [GlobalRole.SUPER_ADMIN]: 'مدير النظام',
  [GlobalRole.INCUBATOR_MANAGER]: 'مدير الحاضنة',
  [GlobalRole.INSTRUCTOR]: 'مدرّب',
  [GlobalRole.MENTOR]: 'موجّه',
  [GlobalRole.STUDENT]: 'رائد أعمال / طالب',
  [GlobalRole.GUEST]: 'ضيف',
};

/** Routes reachable without a session. Authenticated users may still visit them. */
const PUBLIC_ROUTES = ['/programs', '/about'] as const;

/** Routes only meant for anonymous visitors; signed-in users are bounced to their home. */
const AUTH_ROUTES = [LOGIN_ROUTE, '/register'] as const;

interface RouteRule {
  prefix: string;
  roles: readonly GlobalRole[];
}

// Ordered most-specific first: the first matching prefix wins.
const PROTECTED_ROUTE_RULES: readonly RouteRule[] = [
  { prefix: '/admin/settings', roles: [GlobalRole.SUPER_ADMIN] },
  { prefix: '/admin/users', roles: [GlobalRole.SUPER_ADMIN, GlobalRole.INCUBATOR_MANAGER] },
  {
    prefix: '/admin/startups',
    roles: [GlobalRole.SUPER_ADMIN, GlobalRole.INCUBATOR_MANAGER, GlobalRole.MENTOR],
  },
  { prefix: '/admin/content', roles: CONTENT_MANAGER_ROLES },
  { prefix: '/admin/lessons', roles: CONTENT_MANAGER_ROLES },
  { prefix: '/admin/assignments', roles: ASSIGNMENT_MANAGER_ROLES },
  { prefix: '/admin/enrollments', roles: ENROLLMENT_MANAGER_ROLES },
  { prefix: '/admin/grading', roles: SUBMISSION_REVIEWER_ROLES },
  { prefix: '/admin', roles: STAFF_ROLES },
  { prefix: '/dashboard', roles: LEARNER_ROLES },
  { prefix: '/assignments', roles: LEARNER_ROLES },
  { prefix: '/my-startup', roles: [GlobalRole.STUDENT] },
  { prefix: '/certificates', roles: [GlobalRole.STUDENT] },
  { prefix: '/support', roles: ALL_ROLES },
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function parseRole(value: string | null | undefined): GlobalRole | null {
  if (!value) return null;
  return (Object.values(GlobalRole) as string[]).includes(value) ? (value as GlobalRole) : null;
}

export function isStaffRole(role: GlobalRole | null | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly GlobalRole[]).includes(role);
}

export function hasRole(role: GlobalRole | null | undefined, allowed: readonly GlobalRole[]): boolean {
  return !!role && allowed.includes(role);
}

export function getHomeRoute(role: GlobalRole | null | undefined): string {
  if (!role) return LOGIN_ROUTE;
  return isStaffRole(role) ? '/admin/overview' : '/dashboard';
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => matchesPrefix(pathname, route));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesPrefix(pathname, route));
}

function findRule(pathname: string): RouteRule | undefined {
  return PROTECTED_ROUTE_RULES.find((rule) => matchesPrefix(pathname, rule.prefix));
}

export function isProtectedRoute(pathname: string): boolean {
  return findRule(pathname) !== undefined;
}

/** Whether `role` may open `pathname`. Unlisted routes are treated as public. */
export function canAccessRoute(pathname: string, role: GlobalRole | null | undefined): boolean {
  const rule = findRule(pathname);
  if (!rule) return true;
  return hasRole(role, rule.roles);
}

export type RouteDecision =
  | { type: 'allow' }
  | { type: 'login'; redirectTo: string }
  | { type: 'home'; redirectTo: string };

/**
 * Decide what to do with a navigation. Shared by the proxy (cookie role) and the
 * client guard (server-verified role) so both layers enforce identical rules.
 */
export function resolveRouteAccess(
  pathname: string,
  session: { authenticated: boolean; role: GlobalRole | null },
  /** Path (with query) to come back to after signing in. Defaults to `pathname`. */
  returnTo: string = pathname,
): RouteDecision {
  if (isAuthRoute(pathname)) {
    return session.authenticated && session.role
      ? { type: 'home', redirectTo: getHomeRoute(session.role) }
      : { type: 'allow' };
  }

  // "/" is the public landing page; signed-in users go straight to their home.
  if (pathname === '/') {
    return session.authenticated && session.role
      ? { type: 'home', redirectTo: getHomeRoute(session.role) }
      : { type: 'allow' };
  }

  if (!isProtectedRoute(pathname)) return { type: 'allow' };

  if (!session.authenticated) {
    return { type: 'login', redirectTo: buildLoginUrl(returnTo) };
  }

  return canAccessRoute(pathname, session.role)
    ? { type: 'allow' }
    : { type: 'home', redirectTo: getHomeRoute(session.role) };
}

export function buildLoginUrl(returnTo?: string): string {
  if (!returnTo || returnTo === '/' || isAuthRoute(returnTo)) return LOGIN_ROUTE;
  return `${LOGIN_ROUTE}?${REDIRECT_PARAM}=${encodeURIComponent(returnTo)}`;
}

/**
 * Validate a post-login `redirect` param: must be a same-origin path the role can open.
 * Prevents open redirects (`//evil.com`, `https://…`) and role-escalation bounces.
 */
export function getSafeRedirect(target: string | null | undefined, role: GlobalRole): string {
  const fallback = getHomeRoute(role);
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback;
  }
  const pathname = target.split(/[?#]/)[0];
  if (isAuthRoute(pathname) || !canAccessRoute(pathname, role)) return fallback;
  return target;
}
