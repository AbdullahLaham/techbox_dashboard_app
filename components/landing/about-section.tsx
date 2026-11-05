// components/landing/about-section.tsx
import { Sparkle } from 'lucide-react';
import { ABOUT } from './content';
import { GlowCard } from './glow-card';
import { Reveal } from './reveal';
import { CONTAINER, SectionHeader } from './section-header';

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative scroll-mt-20 py-24 lg:py-32">
      <div className={CONTAINER}>
        <Reveal>
          <SectionHeader
            id="about-title"
            eyebrow={ABOUT.eyebrow}
            title={ABOUT.title}
            description={ABOUT.description}
            align="center"
          />
        </Reveal>

        {/* Training • Real Projects • Career Growth */}
        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {ABOUT.pillars.map(({ icon: Icon, title, description }, i) => (
            <Reveal as="li" key={title} variant="scale" delay={i * 120}>
              <GlowCard className="h-full" panelClassName="flex h-full flex-col gap-6 p-7 sm:p-8">
                <div className="flex items-start justify-between">
                  <span className="grid size-14 place-items-center rounded-2xl bg-[linear-gradient(140deg,#f3c76a,#d99b26)] text-navy-900 shadow-[0_12px_24px_-10px_rgb(217_155_38/0.8)] transition-transform duration-500 group-hover/glow:-rotate-6 group-hover/glow:scale-105">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span aria-hidden className="font-display text-5xl leading-none font-bold text-navy-900/[0.07] tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <h3 className="font-display text-xl font-bold text-navy-900">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </ol>
      </div>

      <HighlightsMarquee />
    </section>
  );
}

/** What TechBox runs, scrolling past. Pauses on hover; static and wrapped under reduced motion. */
function HighlightsMarquee() {
  return (
    <Reveal className="tb-marquee mt-16 overflow-hidden py-2 lg:mt-20">
      <p className="sr-only">ما نقدّمه: {ABOUT.highlights.join('، ')}</p>
      <div className="tb-marquee-track" aria-hidden>
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="tb-marquee-copy flex shrink-0 gap-4 pe-4"
          >
            {ABOUT.highlights.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-full border border-navy-900/[0.07] bg-white/80 px-5 py-2.5 font-display text-base font-medium whitespace-nowrap text-navy-900 shadow-[0_1px_2px_rgb(13_24_41/0.04)] sm:text-lg"
              >
                <Sparkle className="size-4 fill-gold text-gold" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </Reveal>
  );
}
