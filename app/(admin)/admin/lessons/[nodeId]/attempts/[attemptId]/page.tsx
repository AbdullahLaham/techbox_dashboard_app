import type { Metadata } from 'next';
import { QuizAttemptDetail } from '@/components/lessons/admin/quiz-attempt-detail';
import { lessonHref } from '@/lib/lessons';

export const metadata: Metadata = { title: 'محاولة اختبار' };

export default async function QuizAttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ nodeId: string; attemptId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ nodeId, attemptId }, query] = await Promise.all([params, searchParams]);
  const program = Array.isArray(query.program) ? query.program[0] : query.program;
  return <QuizAttemptDetail attemptId={attemptId} backHref={lessonHref(nodeId, { program, tab: 'attempts' })} />;
}
