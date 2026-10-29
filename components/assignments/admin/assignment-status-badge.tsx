// components/assignments/admin/assignment-status-badge.tsx
import { Archive, CircleDot, PencilLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ASSIGNMENT_STATUS_LABELS } from '@/lib/labels';
import type { AssignmentStatus } from '@/types/assignments.admin.contract';

const VARIANT = { DRAFT: 'muted', PUBLISHED: 'success', ARCHIVED: 'warning' } as const;
const ICON = { DRAFT: PencilLine, PUBLISHED: CircleDot, ARCHIVED: Archive } as const;

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const Icon = ICON[status];
  return (
    <Badge variant={VARIANT[status]}>
      <Icon aria-hidden /> {ASSIGNMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
