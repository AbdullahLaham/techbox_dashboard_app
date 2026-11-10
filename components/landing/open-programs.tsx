// components/landing/open-programs.tsx
'use client';

import Link from 'next/link';
import { ArrowUpLeft, CalendarDays, Users } from 'lucide-react';
import { usePrograms } from '@/hooks/use-programs';
import { daysUntil, formatNumber, formatShortDate } from '@/lib/format';
import { PROGRAM_TYPE_LABELS } from '@/lib/labels';
import type { ProgramSummary } from '@/types/api.contract';
import { PROGRAMS } from './content';
import { GlowCard } from './glow-card';
import { Reveal } from './reveal';

const MAX_SHOWN = 3;

/** Open programs, those still to start first (soonest on top), then running or undated ones. */
function pickOpenPrograms(programs: ProgramSummary[]): ProgramSummary[] {
  const startsIn = ({ startDate }: ProgramSummary) => {
    if (!startDate) return Infinity;
    const days = daysUntil(startDate);
    return days >= 0 ? days : Infinity;
  };
  return programs
    .filter((program) => program.canEnroll)
    .sort((a, b) => startsIn(a) - startsIn(b))
    .slice(0, MAX_SHOWN);
}

/**
 * Fetched in the browser, so the page stays static and a build never needs the API.
 * When the API is down or nothing is open the block disappears: the catalog link above remains.
 */
export function OpenPrograms() {
  const { data, isPending } = usePrograms();
  const programs = data ? pickOpenPrograms(data) : [];

  if (!isPending && programs.length === 0) return null;

  return (
    <Reveal className="mt-16">
      <h3 className="font-display text-xl font-bold text-navy-900 sm:text-2xl">{PROGRAMS.open.title}</h3>
      <p className="mt-2 text-muted-foreground">{PROGRAMS.open.description}</p>

      <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isPending
          ? Array.from({ length: MAX_SHOWN }, (_, i) => (
              <li key={i} aria-hidden className="h-56 animate-pulse rounded-[1.75rem] border border-navy-900/[0.07] bg-white/70" />
            ))
          : programs.map((program) => (
              <li key={program.id}>
                <OpenProgramCard program={program} />
              </li>
            ))}
      </ul>
    </Reveal>
  );
}

function OpenProgramCard({ program }: { program: ProgramSummary }) {
  const { startDate, seats } = program;
  const upcoming = startDate !== null && daysUntil(startDate) >= 0;

  return (
    <GlowCard className="h-full" panelClassName="flex h-full flex-col gap-4 p-6">
      <span className="w-fit rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-1 text-xs font-medium text-gold-ink">
        {PROGRAM_TYPE_LABELS[program.type]}
      </span>
      <div className="space-y-2">
        <h4 className="font-display text-lg font-bold text-navy-900">{program.title}</h4>
        {program.description && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{program.description}</p>}
      </div>
      <ul className="mt-auto space-y-2 text-sm text-navy-900/75">
        {upcoming && (
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0 text-gold-ink" aria-hidden />
            يبدأ في {formatShortDate(startDate)}
          </li>
        )}
        {seats.remaining !== null && (
          <li className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-gold-ink" aria-hidden />
            المقاعد المتبقية: {formatNumber(seats.remaining)}
          </li>
        )}
      </ul>
      <Link
        href={`/programs/${encodeURIComponent(program.slug)}`}
        className="group inline-flex w-fit items-center gap-2 rounded-full text-sm font-semibold text-navy-900 outline-none hover:text-gold-ink focus-visible:ring-2 focus-visible:ring-gold"
      >
        {PROGRAMS.open.cta}
        <ArrowUpLeft className="size-4 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </Link>
    </GlowCard>
  );
}
