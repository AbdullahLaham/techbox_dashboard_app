import { redirect } from 'next/navigation';
import { LOGIN_ROUTE } from '@/lib/auth/rbac';

// `proxy.ts` sends "/" to the visitor's role home before this renders. This is only a
// fallback for requests that bypass the proxy; the guard then routes signed-in users home.
export default function RootPage() {
  redirect(LOGIN_ROUTE);
}
