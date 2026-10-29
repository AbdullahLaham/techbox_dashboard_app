// lib/lessons.ts
// Helpers for the lesson and quiz editors (types/nodes.contract.ts).
import { QUIZ_LIMITS, type AdminQuiz } from '@/types/nodes.contract';

const scoreFormat = new Intl.NumberFormat('ar-u-nu-latn', { maximumFractionDigits: 2 });

/** Scores and points have up to 2 decimals. */
export function formatScore(value: number): string {
  return scoreFormat.format(value);
}

/** 754 -> "12:34", 3723 -> "1:02:03". */
export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Bunny embed URLs end with the video id (…/embed/<library>/<video>); other URLs are used as is. */
export function externalIdFromUrl(url: string): string {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop();
    return last || url;
  } catch {
    return url;
  }
}

/** Bunny Stream embed pages can be previewed in an iframe; other links only open in a new tab. */
export function isEmbeddableVideo(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && (hostname === 'iframe.mediadelivery.net' || hostname === 'player.mediadelivery.net');
  } catch {
    return false;
  }
}

/**
 * Parses a score or points input: a number with at most 2 decimals, between `min` and `max`.
 * Returns null when invalid. `exclusiveMin` makes `min` itself invalid (points must be > 0).
 */
export function parseScore(value: string, { min = 0, max = Infinity, exclusiveMin = false } = {}): number | null {
  const text = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const n = Number(text);
  if (n > max || n < min || (exclusiveMin && n === min)) return null;
  return n;
}

/**
 * Why the quiz cannot be published yet: the same checks the server makes before answering
 * 409 QUIZ_NOT_READY. Empty when the quiz is ready.
 */
export function getQuizReadinessProblems(quiz: Pick<AdminQuiz, 'questions' | 'passingScore' | 'totalScore'>): string[] {
  const problems: string[] = [];
  if (quiz.questions.length === 0) problems.push('أضف سؤالاً واحداً على الأقل.');

  const incomplete = quiz.questions.filter(
    (q) => q.options.length !== QUIZ_LIMITS.optionsPerQuestion || q.options.filter((o) => o.isCorrect).length !== 1,
  ).length;
  if (incomplete > 0) {
    problems.push(`${incomplete} من الأسئلة لا تحتوي على ${QUIZ_LIMITS.optionsPerQuestion} خيارات بإجابة صحيحة واحدة.`);
  }

  if (quiz.passingScore > quiz.totalScore) {
    problems.push(`درجة النجاح (${formatScore(quiz.passingScore)}) أكبر من مجموع الدرجات (${formatScore(quiz.totalScore)}).`);
  }
  return problems;
}

export type LessonTab = 'questions' | 'settings' | 'attempts' | 'lesson';
export const LESSON_TABS: readonly LessonTab[] = ['questions', 'settings', 'attempts', 'lesson'];

/** Admin lesson editor URL. `program` (slug) lets the page link back to its curriculum. */
export function lessonHref(nodeId: string, { program, tab }: { program?: string; tab?: LessonTab } = {}): string {
  const params = new URLSearchParams();
  if (tab) params.set('tab', tab);
  if (program) params.set('program', program);
  const query = params.toString();
  return `/admin/lessons/${encodeURIComponent(nodeId)}${query ? `?${query}` : ''}`;
}

export function attemptHref(nodeId: string, attemptId: string, program?: string): string {
  const query = program ? `?program=${encodeURIComponent(program)}` : '';
  return `/admin/lessons/${encodeURIComponent(nodeId)}/attempts/${encodeURIComponent(attemptId)}${query}`;
}
