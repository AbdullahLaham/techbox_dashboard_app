import type { Metadata } from 'next';
import { LandingPage } from '@/components/landing/landing-page';

// Signed-out visitors land here; `proxy.ts` sends signed-in users to their role home first.
export const metadata: Metadata = {
  title: { absolute: 'حاضنة TechBox | احتضان الشركات التقنية وتطوير المبرمجين في غزة' },
  description:
    'TechBox حاضنة أعمال ومنصة تعليمية في غزة: برامج احتضان للشركات الناشئة، إرشاد من مختصين، ومعسكرات برمجة عملية للمطوّرين ورواد الأعمال.',
  openGraph: {
    title: 'حاضنة TechBox',
    description: 'من الفكرة إلى الشركة: احتضان، إرشاد، ومعسكرات برمجة في غزة.',
    locale: 'ar_PS',
    type: 'website',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
