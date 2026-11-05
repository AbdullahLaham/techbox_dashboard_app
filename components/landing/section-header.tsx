// components/landing/section-header.tsx
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'start' | 'center';
  className?: string;
}

/**
 * Section heading group; `id` labels the parent section via aria-labelledby. Wrap it in a
 * <Reveal> so the eyebrow rule draws in with it.
 */
export function SectionHeader({ id, eyebrow, title, description, align = 'start', className }: SectionHeaderProps) {
  return (
    <div className={cn('max-w-2xl space-y-4', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <p className={cn('flex items-center gap-3 text-sm font-semibold text-gold-ink', align === 'center' && 'justify-center')}>
          <span aria-hidden className="tb-eyebrow-line h-px w-8 bg-gold" />
          {eyebrow}
          {align === 'center' && <span aria-hidden className="tb-eyebrow-line h-px w-8 bg-gold" />}
        </p>
      )}
      <h2
        id={id}
        className="font-display text-[clamp(1.75rem,1.15rem+2.2vw,2.875rem)] leading-[1.35] font-bold text-balance text-navy-900"
      >
        {title}
      </h2>
      {description && <p className="text-base leading-loose text-pretty text-muted-foreground sm:text-lg">{description}</p>}
    </div>
  );
}

/** Shared page gutter. */
export const CONTAINER = 'mx-auto w-full max-w-7xl px-5 sm:px-8';

/** Soft slate band whose edges fade into the pearl page, so sections flow into each other. */
export const BAND = 'bg-[linear-gradient(180deg,transparent,#edf1f7_14%,#edf1f7_86%,transparent)]';
