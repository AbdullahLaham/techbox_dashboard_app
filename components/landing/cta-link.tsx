// components/landing/cta-link.tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

const VARIANTS = {
  /** Gold, glowing, with a sheen that sweeps across on hover (see `.tb-cta` in landing.css). */
  primary:
    'tb-cta bg-gold font-bold text-navy-900 hover:-translate-y-0.5 hover:bg-[#e0a535] focus-visible:ring-navy-900',
  /** Frosted pearl with a navy hairline. */
  secondary:
    'border border-navy-900/12 bg-white/70 font-semibold text-navy-900 shadow-[0_1px_2px_rgb(13_24_41/0.05)] backdrop-blur-md hover:-translate-y-0.5 hover:border-gold/60 hover:bg-white focus-visible:ring-gold',
} as const;

const SIZES = {
  md: 'gap-2 px-5 py-2.5 text-sm',
  lg: 'gap-2.5 px-7 py-3.5 text-base',
} as const;

interface CtaLinkProps {
  href: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
}

export function CtaLink({ href, variant = 'primary', size = 'lg', className, children }: CtaLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group/cta inline-flex items-center justify-center rounded-full text-center outline-none',
        'transition-[transform,background-color,border-color] duration-300 active:translate-y-0',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {variant === 'primary' && <span aria-hidden className="tb-cta-shine" />}
      {children}
    </Link>
  );
}
