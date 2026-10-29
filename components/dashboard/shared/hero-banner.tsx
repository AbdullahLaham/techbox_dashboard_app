// components/dashboard/shared/hero-banner.tsx
import type { LucideIcon } from 'lucide-react';

interface HeroBannerProps {
  eyebrow: string;
  eyebrowIcon: LucideIcon;
  title: React.ReactNode;
  description: React.ReactNode;
  /** Rendered on the inline-end side (left in RTL) on wide screens. */
  aside?: React.ReactNode;
}

/** Navy & gold page banner shared by the admin and learner home pages. */
export function HeroBanner({ eyebrow, eyebrowIcon: EyebrowIcon, title, description, aside }: HeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-navy-900 via-navy-800 to-navy-900 p-6 text-white shadow-xl sm:p-8">
      {/* Gold glow anchored to the inline-start corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 start-0 w-1/2 bg-[radial-gradient(ellipse_at_top,var(--color-gold)_0%,transparent_65%)] opacity-15"
      />
      <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
            <EyebrowIcon className="h-3.5 w-3.5" aria-hidden /> {eyebrow}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          <div className="text-sm leading-relaxed text-white/75">{description}</div>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </div>
  );
}
