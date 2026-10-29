// proxy.ts
// First line of defence: cookie-based route gating before any render.
// Cookies are client-writable, so this is a UX/perf guard — the backend must still
// authorize every API call, and `AuthGuardProvider` re-checks with the verified role.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE, ROLE_COOKIE, parseRole, resolveRouteAccess } from '@/lib/auth/rbac';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const role = parseRole(request.cookies.get(ROLE_COOKIE)?.value);

  // A token without a recognizable role is a corrupted session: treat as signed out.
  const authenticated = !!token && !!role;
  const decision = resolveRouteAccess(pathname, { authenticated, role }, pathname + search);

  if (decision.type === 'allow') {
    return NextResponse.next();
  }

  const response = NextResponse.redirect(new URL(decision.redirectTo, request.url));
  if (token && !role) {
    response.cookies.delete(AUTH_COOKIE);
    response.cookies.delete(ROLE_COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except Next internals, API routes and static files.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
