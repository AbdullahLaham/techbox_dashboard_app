// lib/assignment-format.ts
// Display helpers for assignments. Dates arrive as ISO UTC strings and are shown in the viewer's timezone.
import {
  getAssignmentBucket,
  getAssignmentState,
  type AssignmentBucket,
  type AssignmentItem,
} from '@/types/assignments.contract';
import { formatRelative } from '@/lib/format';

const LOCALE = 'ar-u-nu-latn';

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const HOUR = 60 * 60 * 1000;
/** A deadline closer than this is shown as urgent. */
const URGENT_WINDOW_MS = 48 * HOUR;

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** IANA name of the viewer's timezone, e.g. "Asia/Gaza". */
export function localTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** ISO UTC → value for `<input type="datetime-local">` in local time ("YYYY-MM-DDTHH:mm"). */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `<input type="datetime-local">` value (local time) → ISO UTC, or null when empty. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export type DeadlineTone = 'danger' | 'warning' | 'muted';

/** Deadline text and colour for a student card: red when overdue, orange when close. */
export function describeDeadline(
  item: Pick<AssignmentItem, 'dueDate' | 'isOverdue' | 'submission'>,
  now: number = Date.now(),
): { text: string; tone: DeadlineTone } {
  if (!item.dueDate) return { text: 'بدون موعد نهائي', tone: 'muted' };
  const due = new Date(item.dueDate).getTime();
  if (item.isOverdue) return { text: `متأخر · انتهى ${formatRelative(item.dueDate, now)}`, tone: 'danger' };
  const stillTodo = getAssignmentBucket(getAssignmentState(item)) === 'TODO';
  if (stillTodo && due > now && due - now <= URGENT_WINDOW_MS) {
    return { text: `ينتهي ${formatRelative(item.dueDate, now)}`, tone: 'warning' };
  }
  return { text: `الموعد: ${formatDateTime(item.dueDate)}`, tone: 'muted' };
}

const BUCKET_ORDER: Record<AssignmentBucket, number> = { TODO: 0, SUBMITTED: 1, DONE: 2 };

/**
 * Work the student must do first (earliest deadline first, no deadline last), then submitted work,
 * then closed work (most recent first). `publishedAt` breaks ties.
 */
export function compareAssignments(a: AssignmentItem, b: AssignmentItem): number {
  const bucketA = getAssignmentBucket(getAssignmentState(a));
  const bucketB = getAssignmentBucket(getAssignmentState(b));
  if (bucketA !== bucketB) return BUCKET_ORDER[bucketA] - BUCKET_ORDER[bucketB];

  const published = (item: AssignmentItem) => new Date(item.publishedAt ?? item.createdAt).getTime();

  if (bucketA === 'TODO') {
    const dueA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dueB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    if (dueA !== dueB) return dueA - dueB;
    return published(b) - published(a);
  }

  const recent = (item: AssignmentItem) =>
    item.submission ? new Date(item.submission.submittedAt).getTime() : published(item);
  return recent(b) - recent(a) || published(b) - published(a);
}

/** The nearest upcoming deadline among TODO items that are not overdue. */
export function findNextDue(items: readonly AssignmentItem[], now: number = Date.now()): AssignmentItem | undefined {
  return items
    .filter(
      (item) =>
        item.dueDate &&
        !item.isOverdue &&
        new Date(item.dueDate).getTime() > now &&
        getAssignmentBucket(getAssignmentState(item)) === 'TODO',
    )
    .sort((a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime())[0];
}
