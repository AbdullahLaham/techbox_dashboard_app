// components/dashboard/admin/quick-actions.tsx
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { QuickAction } from '@/config/navigation';

export function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
      {actions.map(({ title, description, href, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all outline-none hover:border-gold/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-gold"
          >
            <div className="rounded-xl bg-navy-900 p-2.5 text-gold transition-colors group-hover:bg-gold group-hover:text-navy-900 dark:bg-navy-700">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{description}</p>
            </div>
            <ChevronLeft
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-gold ltr:rotate-180"
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
