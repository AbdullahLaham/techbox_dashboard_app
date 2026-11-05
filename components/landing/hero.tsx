// components/landing/hero.tsx
import Link from 'next/link';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ABOUT, CONTACT, HERO, INSTAGRAM_FOLLOWERS } from './content';
import { CtaLink } from './cta-link';
import { HeroBox } from './hero-box';
import { InstagramGlyph } from './instagram-glyph';
import { CONTAINER } from './section-header';

const INSTAGRAM = CONTACT.socials[0];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-36 lg:pt-40 lg:pb-24">
      <HeroBackdrop />

      <div className={cn(CONTAINER, 'grid items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-10')}>
        <div className="tb-hero-exit space-y-7 text-center lg:text-start">
          <p className="tb-intro inline-flex items-center gap-2.5 rounded-full border border-navy-900/10 bg-white/70 px-4 py-1.5 text-sm font-medium text-navy-900/80 shadow-[0_1px_2px_rgb(13_24_41/0.05)] backdrop-blur-md">
            <span aria-hidden className="relative flex size-2">
              <span className="tb-ping absolute inset-0 rounded-full bg-gold" />
              <span className="relative size-2 rounded-full bg-gold" />
            </span>
            {HERO.tagline}
          </p>

          <h1
            id="hero-title"
            className="tb-intro font-display text-[clamp(2.25rem,1.3rem+4vw,4.5rem)] leading-[1.25] font-bold text-balance text-navy-900"
            style={{ animationDelay: '0.12s' }}
          >
            {HERO.titleLead}{' '}
            <span className="relative inline-block">
              <span className="tb-gold-text">{HERO.titleAccent}</span>
              {/* Hand-drawn underline, drawn in after the title lands */}
              <svg
                aria-hidden
                viewBox="0 0 300 16"
                preserveAspectRatio="none"
                className="absolute inset-x-0 -bottom-2 h-3 w-full text-gold sm:-bottom-3 sm:h-4"
              >
                <path
                  className="tb-line"
                  pathLength={1}
                  d="M296 10 C 220 2, 120 2, 4 11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                  style={{ animationDelay: '0.9s' }}
                />
              </svg>
            </span>
          </h1>

          <p
            className="tb-intro mx-auto max-w-xl text-base leading-loose text-pretty text-muted-foreground sm:text-lg lg:mx-0"
            style={{ animationDelay: '0.24s' }}
          >
            {HERO.description}
          </p>

          {/* The three Instagram-bio pillars */}
          <ul
            className="tb-intro flex flex-wrap justify-center gap-2 lg:justify-start"
            style={{ animationDelay: '0.32s' }}
            aria-label="ركائزنا"
          >
            {ABOUT.pillars.map(({ title }) => (
              <li
                key={title}
                className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-1 text-sm font-medium text-gold-ink"
              >
                <Check className="size-3.5" aria-hidden />
                {title}
              </li>
            ))}
          </ul>

          <div
            className="tb-intro flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start"
            style={{ animationDelay: '0.4s' }}
          >
            <CtaLink href="/programs">
              استكشف البرامج
              <ArrowLeft className="size-4 transition-transform group-hover/cta:-translate-x-1" aria-hidden />
            </CtaLink>
            <CtaLink href="/register" variant="secondary">
              أنشئ حسابك
            </CtaLink>
          </div>

          <div
            className="tb-intro flex flex-col items-center gap-3 text-sm text-muted-foreground sm:flex-row sm:justify-center lg:justify-start"
            style={{ animationDelay: '0.5s' }}
          >
            <a
              href={INSTAGRAM.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full outline-none hover:text-navy-900 focus-visible:ring-2 focus-visible:ring-gold"
            >
              <span className="grid size-7 place-items-center rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
                <InstagramGlyph className="size-3.5" />
              </span>
              <span>
                <bdi className="font-bold text-navy-900">{formatNumber(INSTAGRAM_FOLLOWERS)}+</bdi> متابع على إنستغرام
              </span>
            </a>
            <span aria-hidden className="hidden h-4 w-px bg-navy-900/15 sm:block" />
            <span>
              لديك حساب؟{' '}
              <Link href="/login" className="font-semibold text-gold-ink underline-offset-4 hover:underline">
                سجّل الدخول
              </Link>
            </span>
          </div>
        </div>

        <div className="tb-hero-drift">
          <HeroBox />
        </div>
      </div>

      <a
        href="#about"
        className="tb-intro mx-auto mt-14 hidden w-fit flex-col items-center gap-1 rounded-full text-xs font-medium text-muted-foreground outline-none hover:text-navy-900 focus-visible:ring-2 focus-visible:ring-gold lg:flex"
        style={{ animationDelay: '2.4s' }}
      >
        اكتشف المزيد
        <ChevronDown className="tb-nudge size-4 text-gold-ink" aria-hidden />
      </a>
    </section>
  );
}

/** Pearl wash, isometric grid and two soft lights. All gradients, nothing blurred per frame. */
function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f6f7fa_70%)]" />
      <div className="landing-iso-grid absolute inset-0" />
      <div className="absolute -end-40 -top-40 size-[44rem] rounded-full bg-[radial-gradient(closest-side,rgb(217_155_38/0.20),transparent)]" />
      <div className="absolute -start-48 top-1/3 size-[40rem] rounded-full bg-[radial-gradient(closest-side,rgb(42_79_127/0.12),transparent)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
