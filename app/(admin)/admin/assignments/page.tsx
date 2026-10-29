import type { Metadata } from 'next';
import { AdminAssignmentsList } from '@/components/assignments/admin/assignments-list';

export const metadata: Metadata = { title: 'إدارة الواجبات' };

export default function AdminAssignmentsPage() {
  return <AdminAssignmentsList />;
}
