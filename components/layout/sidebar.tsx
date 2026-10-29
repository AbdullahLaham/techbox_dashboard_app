// components/layout/sidebar.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogIn, LogOut, PanelRightClose, PanelRightOpen, X } from 'lucide-react';
import { findActiveNavItem, getNavigation } from '@/config/navigation';
import { useLogout, useSession } from '@/hooks/use-session';
import { useUiStore } from '@/store/use-ui-store';
import { cn } from '@/lib/utils';
import { BrandLogo } from './brand-logo';
import { SidebarNav } from './sidebar-nav';
import { UserAvatar } from './user-avatar';

export function AppSidebar() {
  const pathname = usePathname();
  const { role } = useSession();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen);

  const sections = getNavigation(role);
  const activeHref = findActiveNavItem(pathname, role)?.href;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden
        onClick={() => setMobileOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-navy-900/60 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="app-sidebar"
        aria-label="الشريط الجانبي"
        className={cn(
          // Mobile: off-canvas drawer anchored to the inline-start (right in RTL) edge.
          'fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-border bg-sidebar text-sidebar-foreground shadow-xl transition-[transform,width] duration-300 select-none',
          // Scoped to max-lg so the hide transform can never leak onto the desktop sidebar
          // (an unscoped rtl: variant out-ranks lg:translate-x-0 in Tailwind v4).
          !mobileOpen && 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full',
          // Desktop: sticky, always visible, collapsible to an icon rail.
          'lg:sticky lg:top-0 lg:h-screen lg:shadow-none',
          collapsed && 'lg:w-20',
        )}
      >
        <div className={cn('flex items-center justify-between gap-2 p-6 pb-4', collapsed && 'lg:justify-center lg:px-3')}>
          <Link href="/" className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-gold">
            <span className="hidden lg:block">
              <BrandLogo collapsed={collapsed} />
            </span>
            <span className="lg:hidden">
              <BrandLogo />
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <SidebarRoleCard collapsed={collapsed} />

        <div className={cn('flex-1 overflow-y-auto px-4 py-4', collapsed && 'lg:px-3')}>
          {/* Mobile drawer always shows full labels */}
          <div className="lg:hidden">
            <SidebarNav sections={sections} activeHref={activeHref} collapsed={false} />
          </div>
          <div className="hidden lg:block">
            <SidebarNav sections={sections} activeHref={activeHref} collapsed={collapsed} />
          </div>
        </div>

        <div className="space-y-2 border-t border-border/60 p-4">
          <SidebarUserCard collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar"
            aria-label={collapsed ? 'توسيع القائمة' : 'طيّ القائمة'}
            className="hidden w-full items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
          >
            {/* Panel icons point toward the inline-start edge, which is the right side in RTL */}
            {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
            {!collapsed && <span aria-hidden>طيّ القائمة</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarRoleCard({ collapsed }: { collapsed: boolean }) {
  const { roleLabel } = useSession();

  return (
    <div className={cn('px-4', collapsed && 'lg:hidden')}>
      <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/60 p-3.5">
        <div className="space-y-0.5">
          <span className="block text-[10px] font-semibold text-muted-foreground">مستوى الصلاحية</span>
          <span className="block text-xs font-bold text-foreground">{roleLabel}</span>
        </div>
        <span className="h-2 w-2 animate-pulse rounded-full bg-gold" aria-hidden />
      </div>
    </div>
  );
}

function SidebarUserCard({ collapsed }: { collapsed: boolean }) {
  const { user, displayName, initials } = useSession();
  const logout = useLogout();

  if (!user) {
    return (
      <Link
        href="/login"
        title={collapsed ? 'تسجيل الدخول' : undefined}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold py-3 text-xs font-bold text-navy-900 shadow-md transition-colors hover:bg-gold/90"
      >
        <LogIn className="h-4 w-4" />
        <span className={cn(collapsed && 'lg:sr-only')}>تسجيل الدخول للمنصة</span>
      </Link>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 rounded-2xl bg-muted/40 p-3', collapsed && 'lg:flex-col lg:p-2')}>
      <UserAvatar initials={initials} src={user.avatarUrl} alt={displayName} />
      <div className={cn('min-w-0 flex-1 space-y-0.5', collapsed && 'lg:hidden')}>
        <p className="truncate text-xs font-bold text-foreground">{displayName}</p>
        <p className="truncate text-[10px] text-muted-foreground" dir="ltr">
          {user.email}
        </p>
      </div>
      <button
        type="button"
        onClick={logout}
        title="تسجيل الخروج"
        aria-label="تسجيل الخروج"
        className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        {/* LogOut arrow points "out" toward the inline-end edge */}
        <LogOut className="h-4 w-4 rtl:-scale-x-100" />
      </button>
    </div>
  );
}
