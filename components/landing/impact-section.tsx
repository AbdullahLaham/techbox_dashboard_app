// components/landing/impact-section.tsx
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMPACT, IMPACT_STATS, SUCCESS_STORIES, type SuccessStory } from './content';
import { CountUp } from './count-up';
import { Reveal } from './reveal';
import { BAND, CONTAINER, SectionHeader } from './section-header';

export function ImpactSection() {
  const [lead, ...others] = SUCCESS_STORIES;

  return (
    <section id="impact" aria-labelledby="impact-title" className={cn('relative isolate scroll-mt-20 py-24 lg:py-32', BAND)}>
      <div
        aria-hidden
        className="absolute start-0 top-0 -z-10 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgb(42_79_127/0.10),transparent)]"
      />

      <div className={CONTAINER}>
        <Reveal>
          <SectionHeader id="impact-title" eyebrow={IMPACT.eyebrow} title={IMPACT.title} description={IMPACT.description} />
        </Reveal>

        {/* One glass panel, cells divided by hairlines, so the numbers read as one set.
            Hovering a cell replays its count (see CountUp). */}
        <Reveal variant="scale" delay={100} className="mt-14">
          <dl className="grid grid-cols-2 overflow-hidden rounded-[1.75rem] border border-navy-900/[0.07] bg-white/75 shadow-[0_24px_60px_-36px_rgb(13_24_41/0.4)] backdrop-blur-md lg:grid-cols-4">
            {IMPACT_STATS.map((stat, i) => (
              <div
                key={stat.label}
                data-stat
                className={cn(
                  'group/stat relative flex flex-col-reverse gap-2 p-6 transition-colors duration-300 hover:bg-white sm:p-8',
                  i % 2 === 1 && 'border-s border-navy-900/[0.07]',
                  i >= 2 && 'border-t border-navy-900/[0.07] lg:border-t-0',
                  i === 2 && 'lg:border-s',
                )}
              >
                <dt className="text-sm text-muted-foreground sm:text-base">{stat.label}</dt>
                <dd className="font-display text-[clamp(1.875rem,1.3rem+2.4vw,3.25rem)] leading-none font-bold text-navy-900 tabular-nums">
                  <bdi>
                    <CountUp value={stat.value} />
                    {stat.suffix && <span className="text-gold-ink">{stat.suffix}</span>}
                  </bdi>
                </dd>
                {/* Gold rule that sweeps in from inline-start on hover */}
                <span
                  aria-hidden
                  className="absolute inset-x-6 top-0 h-0.5 origin-right scale-x-[0.35] rounded-full bg-gradient-to-l from-gold to-gold/0 transition-transform duration-500 group-hover/stat:scale-x-100 sm:inset-x-8"
                />
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-5">
          <Reveal variant="start" className="lg:col-span-3">
            <StoryCard story={lead} featured />
          </Reveal>
          <div className="grid gap-5 lg:col-span-2">
            {others.map((story, i) => (
              <Reveal key={story.role} variant="end" delay={(i + 1) * 120}>
                <StoryCard story={story} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryCard({ story, featured = false }: { story: SuccessStory; featured?: boolean }) {
  return (
    <figure
      className={cn(
        'group/story relative flex h-full flex-col justify-between gap-8 overflow-hidden rounded-[1.75rem] border p-7 transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 sm:p-9',
        featured
          ? 'border-gold/30 bg-[linear-gradient(155deg,#fff8e9_0%,#ffffff_55%)] shadow-[0_28px_60px_-34px_rgb(138_90_6/0.55)]'
          : 'border-navy-900/[0.07] bg-white shadow-[0_18px_40px_-30px_rgb(13_24_41/0.35)] hover:border-gold/40',
      )}
    >
      {featured && (
        <div
          aria-hidden
          className="absolute -end-24 -top-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(217_155_38/0.22),transparent)]"
        />
      )}
      <div className="relative space-y-5">
        <Quote
          className={cn(
            'fill-gold/20 text-gold transition-transform duration-500 group-hover/story:-translate-y-0.5 group-hover/story:scale-110 rtl:-scale-x-100',
            featured ? 'size-10' : 'size-7',
          )}
          aria-hidden
        />
        <blockquote>
          <p
            className={cn(
              'leading-relaxed text-pretty text-navy-900',
              featured ? 'font-display text-xl font-medium sm:text-2xl sm:leading-[1.7]' : 'text-base',
            )}
          >
            {story.quote}
          </p>
        </blockquote>
      </div>
      <figcaption className="relative flex flex-wrap items-center justify-between gap-3 border-t border-navy-900/[0.07] pt-5">
        <span className="text-sm font-semibold text-navy-900/85">{story.role}</span>
        <span className="rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-1 text-xs font-medium text-gold-ink">{story.program}</span>
      </figcaption>
    </figure>
  );
}
