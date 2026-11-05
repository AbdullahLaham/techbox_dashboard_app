// components/landing/glow-card.tsx
'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  className?: string;
  /** Classes for the inner glass panel (padding, layout). */
  panelClassName?: string;
  children: React.ReactNode;
}

/**
 * Frosted pearl panel whose 1px rim lights up in gold under the pointer. The glow layer is
 * moved with a direct `transform` write (no state, no inherited CSS variable), so tracking
 * the pointer never re-renders or restyles the card's content.
 */
export function GlowCard({ className, panelClassName, children }: GlowCardProps) {
  const glowRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const glow = glowRef.current;
    if (!glow || e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    glow.style.transform = `translate(${e.clientX - rect.left}px, ${e.clientY - rect.top}px)`;
  };

  return (
    <div
      onPointerMove={onPointerMove}
      className={cn(
        'group/glow relative isolate overflow-hidden rounded-[1.75rem] bg-navy-900/[0.08] p-px',
        'shadow-[0_1px_2px_rgb(13_24_41/0.04),0_18px_40px_-24px_rgb(13_24_41/0.25)]',
        'transition-[transform,box-shadow] duration-500 ease-out',
        'hover:-translate-y-1.5 hover:shadow-[0_1px_2px_rgb(13_24_41/0.04),0_28px_60px_-28px_rgb(138_90_6/0.45)]',
        className,
      )}
    >
      {/* Pointer glow: positioned from the physical top-left corner to match clientX/Y. */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 -z-10 -mt-56 -ml-56 size-112 rounded-full bg-[radial-gradient(circle,rgb(217_155_38/0.7)_0%,rgb(217_155_38/0.18)_35%,transparent_65%)] opacity-0 transition-opacity duration-300 group-hover/glow:opacity-100"
      />
      {/* Resting rim highlight along the top edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 -z-10 h-px bg-gradient-to-l from-transparent via-gold/70 to-transparent"
      />
      <div
        className={cn(
          // No backdrop-blur: the card lifts on hover, and a moving blur repaints every frame.
          'relative h-full rounded-[calc(1.75rem-1px)] bg-[linear-gradient(160deg,rgb(255_255_255/0.97),rgb(255_255_255/0.88))]',
          panelClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
