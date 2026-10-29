// components/layout/brand-logo.tsx
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const markSizes = {
  sm: 'rounded-xl p-2 [&_svg]:h-5 [&_svg]:w-5',
  md: 'rounded-2xl p-2.5 [&_svg]:h-6 [&_svg]:w-6',
  lg: 'rounded-2xl p-3 [&_svg]:h-8 [&_svg]:w-8',
} as const;

export function BrandMark({ size = 'md', className }: { size?: keyof typeof markSizes; className?: string }) {
  return (
    <div className={cn('shrink-0 bg-gold text-navy-900 shadow-md', markSizes[size], className)} aria-hidden>
      <Box className="stroke-[2.5]" />
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
