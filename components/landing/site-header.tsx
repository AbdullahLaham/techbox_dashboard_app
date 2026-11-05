// components/landing/site-header.tsx
'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/layout/brand-logo';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from './content';
import { CtaLink } from './cta-link';

function subscribeToScroll(onChange: () => void) {
  window.addEventListener('scroll', onChange, { passive: true });
  return () => window.removeEventListener('scroll', onChange);
}

/** Re-renders only when the page crosses the threshold, not on every scroll event. */
function useScrolledPast(threshold: number) {
  return useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > threshold,
    () => false,
  );
}

/** The nav anchor whose section currently spans the upper-middle band of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = NAV_LINKS.map((link) => document.querySelector<HTMLElement>(link.href)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return active;
}

export function SiteHeader() {
  const scrolled = useScrolledPast(12);
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300',
        solid
          ? 'border-navy-900/[0.06] bg-white/75 shadow-[0_10px_30px_-18px_rgb(13_24_41/0.25)] backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5 sm:px-8 lg:h-20">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          <BrandMark size="sm" />
          <span className="font-display text-lg leading-none font-bold tracking-wide text-navy-900">TechBox</span>
        </Link>

        <nav aria-label="أقسام الصفحة" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex items-center gap-1 rounded-full border border-navy-900/[0.06] bg-white/50 p-1 backdrop-blur-md">
            {NAV_LINKS.map((link) => {
              const current = active === link.href;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={current ? 'location' : undefined}
                    className={cn(
                      'block rounded-full px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold',
                      current
                        ? 'bg-navy-900 text-white shadow-[0_6px_16px_-8px_rgb(13_24_41/0.6)]'
                        : 'text-navy-900/70 hover:bg-navy-900/[0.05] hover:text-navy-900',
                    )}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-navy-900/80 transition-colors outline-none hover:text-navy-900 focus-visible:ring-2 focus-visible:ring-gold sm:inline-flex"
          >
            تسجيل الدخول
          </Link>
          <CtaLink href="/register" size="md" className="hidden sm:inline-flex">
            أنشئ حسابك
          </CtaLink>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="grid size-10 place-items-center rounded-full border border-navy-900/10 bg-white/70 text-navy-900 backdrop-blur-md outline-none focus-visible:ring-2 focus-visible:ring-gold lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Reading progress (scroll-driven where supported; see .tb-progress) */}
      <div aria-hidden className="tb-progress absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-l from-gold via-[#f0c060] to-gold" />

      {/* `invisible` when closed also removes the links from the tab order and a11y tree. */}
      <div
        id="landing-mobile-menu"
        className={cn(
          'absolute inset-x-0 top-full border-y border-navy-900/[0.06] bg-white px-5 pt-3 pb-6 shadow-[0_24px_40px_-24px_rgb(13_24_41/0.35)] transition-[opacity,transform,visibility] duration-300 sm:px-8 lg:hidden',
          menuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0',
        )}
      >
        <nav aria-label="أقسام الصفحة">
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active === link.href ? 'location' : undefined}
                  className="flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-medium text-navy-900/80 outline-none hover:bg-navy-900/[0.04] hover:text-navy-900 focus-visible:ring-2 focus-visible:ring-gold aria-[current]:text-navy-900"
                >
                  {link.label}
                  {active === link.href && <span aria-hidden className="size-1.5 rounded-full bg-gold" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/login"
            className="rounded-full border border-navy-900/12 bg-white py-3 text-center text-sm font-semibold text-navy-900 outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            تسجيل الدخول
          </Link>
          <CtaLink href="/register" size="md" className="py-3">
            أنشئ حسابك
          </CtaLink>
        </div>
      </div>
    </header>
  );
}
