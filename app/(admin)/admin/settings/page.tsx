import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'إعدادات المنصة' };

export default function Page() {
  return <ComingSoon icon={Settings} title="إعدادات المنصة" description="إعدادات الصلاحيات والتكاملات قيد التطوير." backHref="/admin/overview" backLabel="العودة للوحة التحكم" />;
}
