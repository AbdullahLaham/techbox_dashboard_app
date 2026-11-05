// components/landing/reveal.tsx
'use client';

import { useEffect, useRef } from 'react';

export type RevealVariant = 'up' | 'scale' | 'start' | 'end';

interface RevealProps {
  as?: 'div' | 'li' | 'article';
  /** Entry motion: slide up (default), scale up, or slide in from the inline start / end. */
  variant?: RevealVariant;
  /** ms before this element's transition starts, for staggering siblings. */
  delay?: number;
  /** false: only mark the element as shown so children with `.tb-stagger` animate. */
  fade?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Sets `data-shown` once the element scrolls into view; landing.css turns that into a
 * fade + slide/scale (transform + opacity, so it stays on the compositor). Reduced motion: no-op.
 */
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, fade = true, id, className, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.shown = '';
        observer.disconnect();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      id={id}
      data-reveal={fade ? variant : undefined}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}
