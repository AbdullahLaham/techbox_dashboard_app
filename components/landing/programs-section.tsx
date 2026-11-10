// components/landing/programs-section.tsx
import Link from 'next/link';
import { ArrowUpLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JOURNEY, PROGRAMS, type ProgramOffer } from './content';
import { GlowCard } from './glow-card';
import { OpenPrograms } from './open-programs';
import { Reveal } from './reveal';
import { BAND, CONTAINER, SectionHeader } from './section-header';

const [FEATURED, ...REST] = PROGRAMS.items;
const WIDE = REST[REST.length - 1];
const COMPACT = REST.slice(0, -1);


export function ProgramsSection() {
  return (
    <section id="programs" aria-labelledby="programs-title" className={cn('relative isolate scroll-mt-20 py-24 lg:py-32', BAND)}>
      <div
        aria-hidden
        className="absolute end-0 top-1/4 -z-10 size-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(217_155_38/0.12),transparent)]"
      />

      <div className={CONTAINER}>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader id="programs-title" eyebrow={PROGRAMS.eyebrow} title={PROGRAMS.title} description={PROGRAMS.description} />
          <BrowseLink className="shrink-0" />
        </Reveal>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-6 lg:grid-rows-[auto_auto_auto]">
          <Reveal variant="start" className="md:col-span-2 lg:col-span-4 lg:row-span-2">
            <GlowCard className="h-full" panelClassName="flex flex-col gap-8 p-7 sm:p-9">
              <ProgramIntro program={FEATURED} featured />
              <ul className="grid gap-3 sm:grid-cols-3">
                {FEATURED.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 rounded-xl bg-navy-900/[0.03] p-3 text-sm leading-relaxed text-navy-900/85"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-gold-ink" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <StageTracker />
            </GlowCard>
          </Reveal>

          {COMPACT.map((program, i) => (
            <Reveal key={program.type} variant="end" delay={(i + 1) * 120} className="lg:col-span-2">
              <GlowCard className="h-full" panelClassName="flex h-full flex-col gap-5 p-7">
                <ProgramIntro program={program} />
                <ul className="mt-auto flex flex-wrap gap-2">
                  {program.features.map((feature) => (
                    <li key={feature} className="rounded-full border border-navy-900/10 bg-white px-3 py-1 text-xs text-navy-900/75">
                      {feature}
                    </li>
                  ))}
                </ul>
              </GlowCard>
            </Reveal>
          ))}

          <Reveal delay={300} className="md:col-span-2 lg:col-span-6">
            <GlowCard panelClassName="flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <ProgramIntro program={WIDE} inline />
              <BrowseLink label="تصفّح الورش القادمة" className="shrink-0" />
            </GlowCard>
          </Reveal>
        </div>

        <OpenPrograms />
      </div>
    </section>
  );
}

function ProgramIntro({ program, featured = false, inline = false }: { program: ProgramOffer; featured?: boolean; inline?: boolean }) {
  const Icon = program.icon;
  return (
    <div className={cn('flex gap-5', !inline && 'flex-col')}>
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-2xl transition-transform duration-500 group-hover/glow:-rotate-6 group-hover/glow:scale-105',
          featured
            ? 'size-14 bg-[linear-gradient(140deg,#f3c76a,#d99b26)] text-navy-900 shadow-[0_14px_28px_-10px_rgb(217_155_38/0.85)]'
            : 'size-12 bg-navy-900 text-gold shadow-[0_10px_22px_-10px_rgb(13_24_41/0.7)]',
        )}
      >
        <Icon className={featured ? 'size-6' : 'size-5'} aria-hidden />
      </span>
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className={cn('font-display font-bold text-navy-900', featured ? 'text-2xl sm:text-3xl' : 'text-xl')}>
            {program.label}
          </h3>
          <span className="rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-1 text-xs font-medium text-gold-ink">
            {program.audience}
          </span>
        </div>
        <p className={cn('leading-relaxed text-muted-foreground', featured ? 'max-w-xl text-base sm:text-lg' : 'text-sm sm:text-base')}>
          {program.description}
        </p>
      </div>
    </div>
  );
}

/** Mirrors the platform's startup-stage tracker that incubated teams use. Decorative preview. */
function StageTracker() {
  const current = 2;
  return (
    <div className="mt-auto rounded-2xl border border-navy-900/[0.07] bg-[#f6f7fa] p-5" aria-hidden>
      <div className="mb-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">مرحلة شركتك على المنصة</span>
        <span className="rounded-full bg-navy-900 px-2.5 py-1 font-semibold text-gold">{JOURNEY[current].stage}</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {JOURNEY.map(({ stage }, i) => (
          <span
            key={stage}
            className={cn(
              'h-1.5 rounded-full',
              i < current && 'bg-gold',
              i === current && 'bg-gold shadow-[0_0_12px_#d99b26]',
              i > current && 'bg-navy-900/10',
            )}
          />
        ))}
      </div>
    </div>
  );
}

function BrowseLink({ label = 'تصفّح كل البرامج', className }: { label?: string; className?: string }) {
  return (
    <Link
      href="/programs"
      className={cn(
        'group inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors outline-none hover:border-navy-900 hover:bg-navy-900 hover:text-white focus-visible:ring-2 focus-visible:ring-gold',
        className,
      )}
    >
      {label}
      <ArrowUpLeft className="size-4 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
    </Link>
  );
}
