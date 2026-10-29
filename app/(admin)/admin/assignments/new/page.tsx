import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AssignmentForm } from '@/components/assignments/admin/assignment-form';

export const metadata: Metadata = { title: 'واجب جديد' };

export default function NewAssignmentPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="space-y-2 border-b pb-5">
        <Link href="/admin/assignments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline">
          <ArrowRight className="h-3.5 w-3.5 ltr:rotate-180" aria-hidden /> العودة لقائمة الواجبات
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">إنشاء واجب جديد</h1>
        <p className="text-sm text-muted-foreground">بعد الحفظ كمسودة يمكنك إرفاق ملفات التعليمات ونشر الواجب للطلاب.</p>
      </div>
      <AssignmentForm />
    </div>
  );
}
