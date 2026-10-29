// components/dashboard/shared/section.tsx
import { useId } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
  children: React.ReactNode;
}

export function Section({ title, description, action, className, children }: SectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-0.5">
          <h2 id={headingId} className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </h2>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-gold hover:underline"
          >
            {action.label}
            <ArrowLeft className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
