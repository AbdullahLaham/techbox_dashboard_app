// components/landing/count-up.tsx
'use client';

import { useEffect, useRef } from 'react';
import { formatNumber } from '@/lib/format';

const DURATION_MS = 1600;

/**
 * Counts from 0 to `value` the first time it scrolls into view, and again whenever the
 * pointer enters the closest `[data-stat]` ancestor. The server renders the final number
 * (crawlers, no-JS and reduced motion see it as is). Frames write straight to the text node
 * instead of React state, so counting never re-renders.
 */
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let running = false;
    let played = false;

    const play = () => {
      if (running) return;
      running = true;
      played = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = formatNumber(Math.round(value * eased));
        if (t < 1) frame = requestAnimationFrame(tick);
        else running = false;
      };
      frame = requestAnimationFrame(tick);
    };

    el.textContent = formatNumber(0);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        play();
      },
      { threshold: 0.6 },
    );
    observer.observe(el);

    const host = el.closest<HTMLElement>('[data-stat]');
    const replay = () => played && play();
    host?.addEventListener('pointerenter', replay);

    return () => {
      observer.disconnect();
      host?.removeEventListener('pointerenter', replay);
      cancelAnimationFrame(frame);
      el.textContent = formatNumber(value);
    };
  }, [value]);

  return (
    <>
      <span ref={ref} aria-hidden>
        {formatNumber(value)}
      </span>
      <span className="sr-only">{formatNumber(value)}</span>
    </>
  );
}
