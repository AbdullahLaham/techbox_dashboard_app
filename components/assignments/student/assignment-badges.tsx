// components/assignments/student/assignment-badges.tsx
import { AlertCircle, CheckCircle2, Clock, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ASSIGNMENT_STATE_LABELS } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { AssignmentState } from '@/types/assignments.contract';
import type { DeadlineTone } from '@/lib/assignment-format';

const STATE_STYLE = {
  NOT_SUBMITTED: { variant: 'muted', icon: Clock },
  AWAITING_REVIEW: { variant: 'gold', icon: Clock },
  NEEDS_REVISION: { variant: 'warning', icon: RotateCcw },
  GRADED: { variant: 'success', icon: CheckCircle2 },
  REJECTED: { variant: 'danger', icon: XCircle },
} as const;

export function AssignmentStateBadge({ state }: { state: AssignmentState }) {
  const { variant, icon: Icon } = STATE_STYLE[state];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden /> {ASSIGNMENT_STATE_LABELS[state]}
    </Badge>
  );
}

export function NewPill() {
  return (
    <Badge variant="navy">
      <Sparkles aria-hidden /> جديد
    </Badge>
  );
}

const TONE_CLASS: Record<DeadlineTone, string> = {
  danger: 'text-destructive',
  warning: 'text-amber-700 dark:text-amber-400',
  muted: 'text-muted-foreground',
};

export function DeadlineText({ text, tone, className }: { text: string; tone: DeadlineTone; className?: string }) {
  const Icon = tone === 'muted' ? Clock : AlertCircle;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold', TONE_CLASS[tone], className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {text}
    </span>
  );
}
