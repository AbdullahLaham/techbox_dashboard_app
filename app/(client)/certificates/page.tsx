import type { Metadata } from 'next';
import { Award } from 'lucide-react';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'شهاداتي وإنجازاتي' };

export default function Page() {
  return <ComingSoon icon={Award} title="شهاداتي وإنجازاتي" description="سجل شهاداتك وإنجازاتك قيد التطوير." backHref="/dashboard" backLabel="العودة إلى لوحتي" />;
}
