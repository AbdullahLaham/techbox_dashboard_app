import type { Metadata } from 'next';
import { GradingWorkspace } from '@/components/submissions/admin/grading-workspace';

export const metadata: Metadata = { title: 'تقييم التسليمات' };

export default async function GradingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { assignment } = await searchParams;
  return <GradingWorkspace initialAssignmentId={Array.isArray(assignment) ? assignment[0] : assignment} />;
}
