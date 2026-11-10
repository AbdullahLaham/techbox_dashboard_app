// components/layout/brand-logo.tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';

const markSizes = {
  sm: { box: 'h-9 w-9', px: '36px' },
  md: { box: 'h-11 w-11', px: '44px' },
  lg: { box: 'h-14 w-14', px: '56px' },
} as const;

export function BrandMark({ size = 'md', className }: { size?: keyof typeof markSizes; className?: string }) {
  const { box, px } = markSizes[size];
  return (
    <div className={cn('relative shrink-0 rounded-full shadow-md', box, className)} aria-hidden>
      <Image src="/brand/techbox-mark.png" alt="" fill sizes={px} loading="eager" />
    </div>
  );
}

export function BrandLogo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      {!collapsed && (
        <div className="min-w-0">
          <span className="block bg-gradient-to-l from-navy-900 to-gold bg-clip-text text-lg leading-none font-extrabold tracking-wide text-transparent dark:from-white">
            TechBox
          </span>
          <span className="mt-1 block truncate text-[10px] font-bold text-gold">حاضنة الأعمال والمنصة التعليمية</span>
        </div>
      )}
    </div>
  );
}
