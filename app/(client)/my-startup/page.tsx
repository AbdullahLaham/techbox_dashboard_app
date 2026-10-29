import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'مشروعي الناشئ' };

export default function Page() {
  return <ComingSoon icon={Sparkles} title="مشروعي الناشئ" description="مساحة مشروعك الناشئ مع مستشار الذكاء الاصطناعي قيد التطوير." backHref="/dashboard" backLabel="العودة إلى لوحتي" />;
}
