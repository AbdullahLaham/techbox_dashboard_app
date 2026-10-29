import type { Metadata } from 'next';
import { AdminOverview } from '@/components/dashboard/admin/admin-overview';

export const metadata: Metadata = {
  title: 'لوحة التحكم الرئيسية',
};

export default function AdminOverviewPage() {
  return <AdminOverview />;
}
