import type { Metadata } from 'next';
import { AssignmentsOverview } from '@/components/assignments/student/assignments-overview';

export const metadata: Metadata = { title: 'واجباتي' };

export default function AssignmentsPage() {
  return <AssignmentsOverview />;
}
