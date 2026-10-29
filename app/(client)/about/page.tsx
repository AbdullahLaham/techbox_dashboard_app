import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import { ComingSoon } from '@/components/layout/coming-soon';

export const metadata: Metadata = { title: 'عن حاضنة TechBox' };

export default function Page() {
  return <ComingSoon icon={ShieldCheck} title="عن حاضنة TechBox" description="تعرّف على رسالة الحاضنة وبرامجها وفريقها — الصفحة قيد الإعداد." backHref="/programs" backLabel="استكشف البرامج" />;
}
