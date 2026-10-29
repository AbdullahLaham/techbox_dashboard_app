// app/layout.tsx
import './globals.css';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import QueryProvider from '@/providers/query-provider';
import AuthGuardProvider from '@/providers/auth-guard-provider';
import AppShell from '@/components/layout/app-shell';
import { SessionLoadingScreen } from '@/components/layout/session-screen';

export const metadata: Metadata = {
  title: {
    default: 'TechBox - حاضنة الأعمال والمنصة التعليمية',
    template: '%s | TechBox',
  },
  description: 'منصة موحدة لإدارة حاضنات الأعمال، المسارات التعليمية والمشاريع الناشئة',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="bg-background font-sans text-foreground antialiased selection:bg-gold selection:text-navy-900">
        <QueryProvider>
          {/* AuthGuardProvider reads usePathname/useSearchParams, so it must sit inside Suspense */}
          <Suspense fallback={<SessionLoadingScreen />}>
            <AuthGuardProvider>
              <AppShell>{children}</AppShell>
            </AuthGuardProvider>
          </Suspense>
        </QueryProvider>
      </body>
    </html>
  );
}
