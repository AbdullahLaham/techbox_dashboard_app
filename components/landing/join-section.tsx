// components/landing/join-section.tsx
import { ArrowLeft } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { JOIN } from './content';
import { CtaLink } from './cta-link';
import { Reveal } from './reveal';
import { CONTAINER } from './section-header';

export function JoinSection() {
  return (
    <section id="join" aria-labelledby="join-title" className="relative scroll-mt-20 py-24 lg:py-32">
      <div className={CONTAINER}>
        <Reveal
          variant="scale"
          className="relative isolate overflow-hidden rounded-[2rem] border border-gold/30 bg-[linear-gradient(140deg,#fffaf0_0%,#ffffff_45%,#eef3fa_100%)] px-6 py-14 shadow-[0_40px_80px_-48px_rgb(138_90_6/0.55)] sm:px-12 lg:px-16 lg:py-20"
        >
          {/* Gold light rising from the bottom edge, echoing the hero box */}
          <div
            aria-hidden
            className="absolute inset-x-0 -bottom-1/2 -z-10 h-full bg-[radial-gradient(ellipse_55%_60%_at_50%_100%,rgb(217_155_38/0.28),transparent)]"
          />
          <div aria-hidden className="landing-iso-grid absolute inset-0 -z-10 rotate-180" />

          <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
            <div className="space-y-6 text-center lg:text-start">
              <p className="text-sm font-semibold text-gold-ink">{JOIN.eyebrow}</p>
              <h2
                id="join-title"
                className="font-display text-[clamp(2rem,1.3rem+2.8vw,3.25rem)] leading-[1.3] font-bold text-balance text-navy-900"
              >
                {JOIN.title}
              </h2>
              <p className="mx-auto max-w-md text-base leading-loose text-muted-foreground sm:text-lg lg:mx-0">{JOIN.description}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <CtaLink href="/register">
                  أنشئ حسابك
                  <ArrowLeft className="size-4 transition-transform group-hover/cta:-translate-x-1" aria-hidden />
                </CtaLink>
                <CtaLink href="/programs" variant="secondary">
                  استكشف البرامج
                </CtaLink>
              </div>
            </div>

            <ol className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {JOIN.steps.map((step, i) => (
                <li
                  key={step.title}
                  className="tb-stagger group/step flex gap-4 rounded-2xl border border-navy-900/[0.07] bg-white/80 p-5 shadow-[0_1px_2px_rgb(13_24_41/0.04)] backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-gold/50 hover:shadow-[0_18px_36px_-24px_rgb(138_90_6/0.55)] sm:flex-col lg:flex-row lg:items-center"
                  style={{ transitionDelay: `${250 + i * 130}ms` }}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-900 font-display text-sm font-bold text-gold transition-colors duration-300 group-hover/step:bg-gold group-hover/step:text-navy-900">
                    {formatNumber(i + 1)}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-display text-base font-bold text-navy-900">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
