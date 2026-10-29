// components/layout/header.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search } from 'lucide-react';
import { findActiveNavItem } from '@/config/navigation';
import { useSession } from '@/hooks/use-session';
import { useUiStore } from '@/store/use-ui-store';
import { UserAvatar } from './user-avatar';

export function AppHeader() {
  const pathname = usePathname();
  const { user, role, roleLabel, displayName, initials } = useSession();
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  const pageTitle = findActiveNavItem(pathname, role)?.title ?? 'TechBox';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/70 px-4 backdrop-blur-md sm:px-6 lg:h-20 lg:px-8">
      <button
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label="فتح القائمة"
        aria-expanded={mobileNavOpen}
        aria-controls="app-sidebar"
        className="rounded-xl border border-border bg-background p-2.5 text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <p className="truncate text-sm font-bold text-foreground lg:hidden">{pageTitle}</p>

      <HeaderSearch />

      {/* ms-auto pushes the tool cluster to the inline-end edge (left in RTL) */}
      <div className="ms-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="الإشعارات (يوجد جديد)"
          className="relative rounded-2xl border border-border bg-background p-2.5 text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute end-2 top-2 h-2 w-2 animate-ping rounded-full bg-gold" aria-hidden />
          <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-gold" aria-hidden />
        </button>

        {user && (
          <div className="flex items-center gap-3 border-s border-border ps-3">
            <div className="hidden text-end sm:block">
              <span className="block text-xs font-bold text-foreground">{displayName}</span>
              <span className="block text-[10px] font-semibold text-gold">{roleLabel}</span>
            </div>
            <UserAvatar initials={initials} src={user.avatarUrl} alt={displayName} />
          </div>
        )}
      </div>
    </header>
  );
}

function HeaderSearch() {
  const inputRef = useRef<HTMLInputElement>(null);

  // Ctrl/⌘ + K focuses search from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="relative hidden w-full max-w-md md:block">
      <label htmlFor="global-search" className="sr-only">
        البحث في المنصة
      </label>
      <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        placeholder="ابحث عن البرامج، الدروس، أو المشاريع الناشئة…"
        className="w-full rounded-2xl border border-border bg-background py-2.5 ps-10 pe-14 text-xs transition-all focus:ring-2 focus:ring-gold focus:outline-none"
      />
      {/* No dir="ltr" here: it would flip this element's own `end-3` to the right edge */}
      <kbd className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
        <bdi>Ctrl K</bdi>
      </kbd>
    </form>
  );
}
