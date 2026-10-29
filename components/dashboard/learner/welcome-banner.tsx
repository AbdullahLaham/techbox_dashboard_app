// components/dashboard/learner/welcome-banner.tsx
import Link from 'next/link';
import { CalendarClock, Compass, Rocket, Sparkles } from 'lucide-react';
import { HeroBanner } from '@/components/dashboard/shared/hero-banner';
import type { LearnerStartupSnapshot } from '@/types/dashboard';
import { STARTUP_STAGE_LABELS } from '@/lib/labels';
import { formatPercent, formatRelative, formatTime } from '@/lib/format';

function greetingFor(hour: number): string {
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء النور';
}

interface WelcomeBannerProps {
  firstName?: string;
  activityRate: number;
  startup?: LearnerStartupSnapshot;
  now: number;
}

export function WelcomeBanner({ firstName, activityRate, startup, now }: WelcomeBannerProps) {
  const greeting = greetingFor(new Date(now).getHours());

  return (
    <HeroBanner
      eyebrow="بوابة رواد الأعمال والطلاب"
      eyebrowIcon={Sparkles}
      title={
        <>
          {greeting}{firstName ? `، ${firstName}` : ''} 👋
        </>
      }
      description={
        <div className="space-y-1">
          <p>
            معدل نشاطك هذا الشهر <bdi className="font-bold text-gold">{formatPercent(activityRate)}</bdi> — استمر على هذا
            الإيقاع!
          </p>
          {startup?.nextMentorSessionAt && (
            <p className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-gold" aria-hidden />
              جلسة الإرشاد القادمة {formatRelative(startup.nextMentorSessionAt, now)} الساعة{' '}
              <bdi>{formatTime(startup.nextMentorSessionAt)}</bdi>
            </p>
          )}
        </div>
      }
      aside={
        startup ? (
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <div className="rounded-xl bg-gold p-3 text-navy-900 shadow-md">
              <Rocket className="h-6 w-6 stroke-[2.5]" aria-hidden />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs text-white/70">{startup.name}</span>
              <span className="block text-sm font-bold text-gold">{STARTUP_STAGE_LABELS[startup.stage]}</span>
            </div>
          </div>
        ) : (
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy-900 shadow-lg transition-colors hover:bg-gold/90"
          >
            <Compass className="h-4 w-4" /> استكشف البرامج
          </Link>
        )
      }
    />
  );
}
