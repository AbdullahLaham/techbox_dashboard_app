import type { Metadata } from 'next';
import { AssignmentDetailView } from '@/components/assignments/student/assignment-detail';

export const metadata: Metadata = { title: 'تفاصيل الواجب' };

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssignmentDetailView id={id} />;
}
