import type { Metadata } from 'next';
import { LessonEditor } from '@/components/lessons/admin/lesson-editor';
import { LESSON_TABS, type LessonTab } from '@/lib/lessons';

export const metadata: Metadata = { title: 'تحرير الدرس' };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LessonEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ nodeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ nodeId }, query] = await Promise.all([params, searchParams]);
  const tab = firstValue(query.tab);
  return (
    <LessonEditor
      nodeId={nodeId}
      programSlug={firstValue(query.program)}
      initialTab={LESSON_TABS.includes(tab as LessonTab) ? (tab as LessonTab) : undefined}
    />
  );
}
