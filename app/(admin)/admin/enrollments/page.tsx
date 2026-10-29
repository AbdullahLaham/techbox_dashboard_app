import type { Metadata } from 'next';
import { EnrollmentsReview } from '@/components/enrollments/admin/enrollments-review';
import { ENROLLMENT_STATUSES, type EnrollmentStatus } from '@/types/api.contract';

export const metadata: Metadata = { title: 'طلبات التسجيل' };

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ programId?: string; status?: string }>;
}) {
  const { programId, status } = await searchParams;
  // Links from the programs table open the page pre-filtered (e.g. ?programId=…&status=PENDING).
  const initialStatus = ENROLLMENT_STATUSES.includes(status as EnrollmentStatus) ? (status as EnrollmentStatus) : 'PENDING';
  return <EnrollmentsReview initialProgramId={programId} initialStatus={initialStatus} />;
}
