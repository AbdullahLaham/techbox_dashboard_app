// components/assignments/student/assignment-card.tsx
import Link from 'next/link';
import { MessageSquareText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { AssignmentStateBadge, DeadlineText, NewPill } from '@/components/assignments/student/assignment-badges';
import { describeDeadline } from '@/lib/assignment-format';
import { SUBMISSION_TYPE_LABELS } from '@/lib/labels';
import { getAssignmentState, type AssignmentItem } from '@/types/assignments.contract';

/** Score bar for graded work. Hidden when the score is missing (spec A2). */
export function ScoreBar({ score, maxScore }: { score: number | null; maxScore: number }) {
  if (score === null) return null;
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">الدرجة</span>
        <span className="font-bold text-foreground tabular-nums">
          <bdi>
            {score} / {maxScore}
          </bdi>
        </span>
      </div>
      <Progress value={pct} label="الدرجة" indicatorClassName={pct >= 50 ? 'bg-emerald-500' : 'bg-amber-500'} />
    </div>
  );
}

export function AssignmentCard({ item, now }: { item: AssignmentItem; now: number }) {
  const state = getAssignmentState(item);
  const deadline = describeDeadline(item, now);
  const showFeedback = !!item.submission?.feedback && (state === 'NEEDS_REVISION' || state === 'REJECTED' || state === 'GRADED');

  return (
    <Link
      href={`/assignments/${item.id}`}
      className="group flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-sm transition-all outline-none hover:border-gold/40 hover:shadow-md focus-visible:ring-2 focus-visible:ring-gold"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-[11px] font-semibold text-gold">{item.program.title}</p>
          <h3 className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-gold">{item.title}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {item.isNew && <NewPill />}
          <AssignmentStateBadge state={state} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <DeadlineText text={deadline.text} tone={deadline.tone} />
        <span className="text-[11px] text-muted-foreground">{SUBMISSION_TYPE_LABELS[item.allowedType]}</span>
      </div>

      {state === 'GRADED' && item.submission && <ScoreBar score={item.submission.score} maxScore={item.maxScore} />}

      {showFeedback && (
        <p className="flex gap-2 rounded-xl bg-muted/50 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
          <span className="line-clamp-2">{item.submission?.feedback}</span>
        </p>
      )}
    </Link>
  );
}
