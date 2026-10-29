// components/layout/sidebar-nav.tsx
'use client';

import Link from 'next/link';
import type { NavItem, NavSection } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarNavProps {
  sections: readonly NavSection[];
  activeHref: string | undefined;
  collapsed: boolean;
}

export function SidebarNav({ sections, activeHref, collapsed }: SidebarNavProps) {
  return (
    <nav aria-label="القائمة الرئيسية" className="space-y-5">
      {sections.map((section) => (
        <div key={section.id} className="space-y-1.5">
          {collapsed ? (
            <div className="mx-auto h-px w-6 bg-border" aria-hidden />
          ) : (
            <p className="px-4 text-[10px] font-bold tracking-wide text-muted-foreground/80">{section.title}</p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.href}>
                <SidebarNavLink item={item} active={item.href === activeHref} collapsed={collapsed} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarNavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.title : undefined}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-gold',
        collapsed ? 'justify-center p-3' : 'px-4 py-3',
        active
          ? 'bg-navy-900 text-white shadow-md dark:bg-gold dark:text-navy-900'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {/* Gold accent bar on the inline-start edge (right side in RTL) */}
      {active && <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-gold dark:bg-navy-900" aria-hidden />}

      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition-colors',
          active ? 'text-gold dark:text-navy-900' : 'text-muted-foreground group-hover:text-gold',
        )}
      />

      {collapsed ? (
        <span className="sr-only">{item.title}</span>
      ) : (
        <>
          <span className="flex-1 truncate">{item.title}</span>
          {item.badge && (
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                active ? 'bg-gold text-navy-900 dark:bg-navy-900 dark:text-white' : 'bg-gold/15 text-gold',
              )}
            >
              {item.badge}
            </span>
          )}
        </>
      )}

      {collapsed && item.badge && <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />}
    </Link>
  );
}
