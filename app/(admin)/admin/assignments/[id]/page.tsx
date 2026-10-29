import type { Metadata } from 'next';
import { AssignmentEditor } from '@/components/assignments/admin/assignment-editor';

export const metadata: Metadata = { title: 'تعديل الواجب' };

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssignmentEditor id={id} />;
}
