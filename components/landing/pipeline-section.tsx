// components/landing/pipeline-section.tsx
import { ArrowLeft, PackageCheck } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { JOURNEY, PIPELINE } from './content';
import { CtaLink } from './cta-link';
import { Reveal } from './reveal';
import { CONTAINER, SectionHeader } from './section-header';

export function PipelineSection() {
  return (
    <section id="pipeline" aria-labelledby="pipeline-title" className="relative isolate scroll-mt-20 py-24 lg:py-32">
      <div aria-hidden className="landing-iso-grid absolute inset-0 -z-10 opacity-70" />

      <div className={CONTAINER}>
        <Reveal>
          <SectionHeader
            id="pipeline-title"
            eyebrow={PIPELINE.eyebrow}
            title={PIPELINE.title}
            description={PIPELINE.description}
            align="center"
          />
        </Reveal>

        <Reveal fade={false} className="relative mt-16 lg:mt-20">
          {/* Track: vertical along the inline-start side on small screens, horizontal on large */}
          {/* Track through the node centres (nodes are 3rem, the track 2px). On small screens it
              fades out past the last node instead of stopping at a measured length. */}
          <div
            aria-hidden
            className={cn(
              'absolute rounded-full bg-gradient-to-b from-navy-900/10 via-navy-900/10 to-transparent',
              'start-[calc(1.5rem-1px)] top-6 bottom-0 w-0.5',
              'lg:start-[10%] lg:end-[10%] lg:top-[calc(1.5rem-1px)] lg:bottom-auto lg:h-0.5 lg:w-auto lg:bg-navy-900/10 lg:bg-none',
            )}
          >
            <div className="tb-track-fill absolute inset-0 rounded-full bg-gradient-to-b from-gold via-gold/80 to-transparent lg:bg-gradient-to-l lg:from-gold lg:via-gold lg:to-gold/50" />
          </div>

          <ol className="relative grid gap-6 lg:grid-cols-5 lg:gap-5">
            {JOURNEY.map(({ stage, description, output }, i) => (
              <li
                key={stage}
                className="tb-stagger group/stage flex gap-5 lg:flex-col lg:items-center"
                style={{ transitionDelay: `${200 + i * 140}ms` }}
              >
                <span
                  className={cn(
                    'relative grid size-12 shrink-0 place-items-center rounded-full border-2 border-gold bg-white font-display text-base font-bold text-navy-900',
                    'shadow-[0_0_0_6px_#f6f7fa,0_8px_24px_-6px_rgb(217_155_38/0.6)] transition-[background-color,color] duration-300',
                    'group-hover/stage:bg-navy-900 group-hover/stage:text-gold',
                  )}
                >
                  {formatNumber(i + 1)}
                </span>

                <div
                  className={cn(
                    'flex-1 space-y-3 rounded-2xl border border-navy-900/[0.07] bg-white/85 p-5 shadow-[0_1px_2px_rgb(13_24_41/0.04)] backdrop-blur-sm',
                    'transition-[transform,border-color,box-shadow] duration-300 group-hover/stage:-translate-y-1 group-hover/stage:border-gold/50 group-hover/stage:shadow-[0_20px_40px_-24px_rgb(138_90_6/0.5)]',
                    'lg:w-full lg:text-center',
                  )}
                >
                  <h3 className="font-display text-lg font-bold text-navy-900">{stage}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-gold/[0.1] px-2.5 py-1 text-xs font-semibold text-gold-ink">
                    <PackageCheck className="size-3.5" aria-hidden />
                    <span>
                      <span className="sr-only">المُخرَج: </span>
                      {output}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal
          variant="scale"
          className="mx-auto mt-14 flex max-w-3xl flex-col items-center justify-between gap-5 rounded-3xl border border-navy-900/[0.07] bg-white/80 p-6 text-center shadow-[0_20px_50px_-30px_rgb(13_24_41/0.35)] backdrop-blur-md sm:flex-row sm:p-7 sm:text-start"
        >
          <div className="space-y-1">
            <p className="font-display text-lg font-bold text-navy-900">لديك فكرة تستحق أن تصير شركة؟</p>
            <p className="text-sm text-muted-foreground">قدّم على دفعة الاحتضان القادمة وابدأ من المحطة الأولى.</p>
          </div>
          <CtaLink href="/programs" size="md" className="shrink-0">
            قدّم على الدفعة
            <ArrowLeft className="size-4 transition-transform group-hover/cta:-translate-x-1" aria-hidden />
          </CtaLink>
        </Reveal>
      </div>
    </section>
  );
}
