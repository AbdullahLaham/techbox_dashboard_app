// components/layout/coming-soon.tsx
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  backHref: string;
  backLabel: string;
}

/** Placeholder for routes that exist in navigation but are not built yet. */
export function ComingSoon({ title, description, icon: Icon = Construction, backHref, backLabel }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 rounded-3xl border border-dashed bg-card/50 p-10 text-center">
      <div className="rounded-2xl bg-gold/10 p-4 text-gold">
        <Icon className="h-8 w-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <span className="inline-block rounded-full bg-navy-900 px-3 py-1 text-[10px] font-bold text-gold dark:bg-gold dark:text-navy-900">
          قريباً
        </span>
        <h1 className="text-2xl font-extrabold text-foreground">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
      >
        {backLabel} <ArrowLeft className="h-4 w-4 ltr:rotate-180" aria-hidden />
      </Link>
    </div>
  );
}
