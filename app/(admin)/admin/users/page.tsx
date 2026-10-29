import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'الطلاب والموجّهون' };

export default function Page() {
  return <ComingSoon icon={Users} title="الطلاب والموجّهون" description="إدارة المستخدمين والأدوار والدعوات قيد التطوير." backHref="/admin/overview" backLabel="العودة للوحة التحكم" />;
}
