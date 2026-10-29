import type { Metadata } from 'next';
import { HelpCircle } from 'lucide-react';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'الدعم والمساعدة' };

export default function Page() {
  return <ComingSoon icon={HelpCircle} title="الدعم والمساعدة" description="مركز المساعدة والتواصل مع فريق الدعم قيد التطوير." backHref="/" backLabel="العودة للرئيسية" />;
}
