// app/(client)/programs/page.tsx
'use client';

import { usePrograms } from '@/hooks/use-programs';
import Link from 'next/link';
import { Users, Layers, Play, Loader2, Sparkles, Compass } from 'lucide-react';

export default function ProgramsCatalogPage() {
  const { data: programs, isLoading, isError } = usePrograms();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-rose-500 bg-rose-500/10 rounded-2xl border border-rose-500/20">
        فشل في تحميل قائمة البرامج. يرجى التحقق من اتصال الإنترنت الخاص بك.
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* رأس الصفحة الترحيبية */}
      <div className="relative rounded-3xl bg-gradient-to-l from-navy-900 via-navy-800 to-navy-900 p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1/3 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/20 px-3 py-1 text-xs font-semibold text-gold border border-gold/30">
            <Sparkles className="h-3.5 w-3.5" /> كتالوج منصة TechBox التعليمية
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">استكشف البرامج ومعسكرات التدريب</h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            انضم إلى أحدث المسارات التعليمية، المعسكرات التقنية، وبُطولات حاضنات الأعمال المطورة خصيصاً لتطوير مهاراتك البرمجية والريادية.
          </p>
        </div>
      </div>

      {/* شبكة عرض البرامج */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {programs?.map((program) => (
          <div key={program.id} className="rounded-3xl border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
            <div>
              {/* صورة الغلاف إن وجدت */}
              {program.coverImage ? (
                <div className="h-40 w-full overflow-hidden relative border-b border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- cover URLs are user-provided, arbitrary hosts */}
                  <img src={program.coverImage} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : (
                <div className="h-32 w-full bg-navy-900/10 flex items-center justify-center border-b border-border">
                  <Compass className="h-10 w-10 text-gold" />
                </div>
              )}

              <div className="p-6 space-y-3">
                <span className="text-[10px] font-extrabold text-gold uppercase tracking-wider bg-gold/10 px-3 py-1 rounded-full border border-gold/20 inline-block">
                  {program.type}
                </span>
                <h2 className="text-lg font-bold text-foreground">{program.title}</h2>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{program.description}</p>
              </div>
            </div>

            <div className="p-6 pt-0 space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gold" /> {program._count?.enrollments || 0} ملتحق
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-gold" /> {program._count?.tracks || 0} مسارات
                </span>
              </div>

              <Link
                href={`/programs/${program.slug}`}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-navy-900 dark:bg-gold dark:text-navy-900 text-white hover:opacity-90 py-3 text-xs font-bold shadow-md transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> دخول الفصول الدراسية
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}