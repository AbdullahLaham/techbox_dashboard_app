import type { Metadata } from 'next';
import { LearnerOverview } from '@/components/dashboard/learner/learner-overview';

export const metadata: Metadata = {
  title: 'لوحتي الشخصية',
};

export default function ClientDashboardPage() {
  return <LearnerOverview />;
}
