// components/layout/app-shell.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isAuthRoute } from '@/lib/auth/rbac';
import { useUiStore } from '@/store/use-ui-store';
import { AppSidebar } from './sidebar';
import { AppHeader } from './header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  // Close the mobile drawer after every navigation.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  // صفحة الهبوط تحمل رأسها وتذييلها الخاصين
  if (pathname === '/') return <>{children}</>;

  // صفحات الدخول والتسجيل تعرض بدون الشريط الجانبي والهيدر
  if (isAuthRoute(pathname)) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    // In an RTL document the first flex child sits on the right: sidebar → right edge.
    <div className="flex min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-navy-900"
      >
        تخطَّ إلى المحتوى
      </a>

      <AppSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
