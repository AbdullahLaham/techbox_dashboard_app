import type { Metadata } from 'next';
import { SubmissionReview } from '@/components/submissions/admin/submission-review';

export const metadata: Metadata = { title: 'تقييم التسليم' };

export default async function SubmissionReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SubmissionReview submissionId={id} />;
}
