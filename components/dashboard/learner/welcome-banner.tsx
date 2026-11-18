// components/dashboard/learner/welcome-banner.tsx
import Link from 'next/link';
import { Compass, PlayCircle, Sparkles } from 'lucide-react';
import { HeroBanner } from '@/components/dashboard/shared/hero-banner';
import type { HomeContinueLearning } from '@/types/home.contract';
import { formatNumber } from '@/lib/format';

function greetingFor(hour: number): string {
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء النور';
}

interface WelcomeBannerProps {
  firstName?: string;
  /** Days with learning activity this week (Saturday to Friday). */
  activeDaysThisWeek: number;
  continueLearning: HomeContinueLearning | null;
  now: number;
}

export function WelcomeBanner({ firstName, activeDaysThisWeek, continueLearning, now }: WelcomeBannerProps) {
  const greeting = greetingFor(new Date(now).getHours());

  return (
    <HeroBanner
      eyebrow="بوابة رواد الأعمال والطلاب"
      eyebrowIcon={Sparkles}
      title={
        <>
          {greeting}
          {firstName ? `، ${firstName}` : ''} 👋
        </>
      }
      description={
        activeDaysThisWeek > 0 ? (
          <p>
            تعلّمت في <bdi className="font-bold text-gold">{formatNumber(activeDaysThisWeek)}</bdi> من أيام هذا الأسبوع.
            استمر على هذا الإيقاع!
          </p>
        ) : (
          <p>ابدأ أسبوعك بدرس جديد، فكل خطوة صغيرة تقرّبك من هدفك.</p>
        )
      }
      aside={
        continueLearning ? (
          <Link
            href={`/programs/${continueLearning.program.slug}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-bold text-navy-900 shadow-lg transition-colors hover:bg-gold/90"
          >
            <PlayCircle className="h-4 w-4" /> تابع {continueLearning.program.title}
          </Link>
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
