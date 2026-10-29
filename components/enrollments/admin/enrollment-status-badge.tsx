// components/enrollments/admin/enrollment-status-badge.tsx
import { Badge } from '@/components/ui/badge';
import { ENROLLMENT_STATUS_LABELS_AR, type EnrollmentStatus } from '@/types/api.contract';

const VARIANT: Record<EnrollmentStatus, 'warning' | 'success' | 'navy' | 'muted' | 'danger'> = {
  PENDING: 'warning',
  ACTIVE: 'success',
  COMPLETED: 'navy',
  SUSPENDED: 'danger',
  DROPPED: 'muted',
  REJECTED: 'danger',
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  return <Badge variant={VARIANT[status]}>{ENROLLMENT_STATUS_LABELS_AR[status]}</Badge>;
}
