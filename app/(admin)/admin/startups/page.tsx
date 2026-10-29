import type { Metadata } from 'next';
import { FolderKanban } from 'lucide-react';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'الشركات الناشئة والمشاريع' };

export default function Page() {
  return <ComingSoon icon={FolderKanban} title="الشركات الناشئة والمشاريع" description="متابعة مراحل المشاريع المحتضنة ومؤشراتها قيد التطوير." backHref="/admin/overview" backLabel="العودة للوحة التحكم" />;
}
