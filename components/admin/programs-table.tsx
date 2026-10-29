// components/admin/programs-table.tsx
'use client';

import Link from 'next/link';
import { Layers, Users, ChevronLeft, Edit, Trash2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Program, ProgramStatus } from '@/types/program';
import { PROGRAM_STATUS_LABELS_AR } from '@/types/api.contract';
import { PROGRAM_TYPE_LABELS } from '@/lib/labels';

const STATUS_VARIANT: Record<ProgramStatus, 'muted' | 'success' | 'gold' | 'navy' | 'warning'> = {
  DRAFT: 'muted',
  PUBLISHED: 'success',
  ONGOING: 'gold',
  COMPLETED: 'navy',
  ARCHIVED: 'warning',
};

interface ProgramsTableProps {
  programs: Program[] | undefined;
  onEdit: (program: Program) => void;
  onDelete: (program: Program) => void;
}

export function ProgramsTable({ programs, onEdit, onDelete }: ProgramsTableProps) {
  if (programs && programs.length === 0) {
    return (
      <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground" dir="rtl">
        لا توجد برامج مطابقة.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-x-auto" dir="rtl">
      <table className="w-full text-right text-sm">
        <thead className="bg-muted/50 border-b text-xs uppercase text-muted-foreground">
          <tr>
            <th className="p-4 font-semibold">الغلاف</th>
            <th className="p-4 font-semibold">عنوان البرنامج</th>
            <th className="p-4 font-semibold">النوع</th>
            <th className="p-4 font-semibold">الحالة</th>
            <th className="p-4 font-semibold">المسارات والطلاب</th>
            <th className="p-4 font-semibold text-left">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {programs?.map((program) => (
            <tr key={program.id} className="hover:bg-muted/30 transition-colors">
              <td className="p-4">
                {program.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- cover URLs are user-provided, arbitrary hosts
                  <img
                    src={program.coverImage}
                    alt={program.title}
                    className="h-10 w-16 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="h-10 w-16 rounded-lg bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-medium">
                    بدون صورة
                  </div>
                )}
              </td>

              <td className="p-4">
                <div className="font-bold text-foreground">{program.title}</div>
                <div className="text-xs text-muted-foreground font-mono" dir="ltr">/{program.slug}</div>
              </td>

              <td className="p-4">
                <Badge variant="gold">{PROGRAM_TYPE_LABELS[program.type]}</Badge>
              </td>

              <td className="p-4 space-y-1">
                <Badge variant={STATUS_VARIANT[program.status]}>{PROGRAM_STATUS_LABELS_AR[program.status]}</Badge>
                {!program.isEnrollmentOpen && <div className="text-[10px] text-muted-foreground">التسجيل مغلق</div>}
              </td>

              <td className="p-4 text-xs text-muted-foreground">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1" title="المسارات">
                    <Layers className="h-3.5 w-3.5 text-gold" /> {program._count.tracks}
                  </span>
                  <span className="flex items-center gap-1" title="المقاعد المحجوزة / المتاحة">
                    <Users className="h-3.5 w-3.5 text-gold" /> {program.seats.taken}
                    {program.seats.max !== null && ` / ${program.seats.max}`}
                  </span>
                  {program.enrollmentCounts.PENDING > 0 && (
                    <Link
                      href={`/admin/enrollments?programId=${program.id}&status=PENDING`}
                      className="flex items-center gap-1 font-semibold text-amber-600 hover:underline"
                    >
                      <Clock className="h-3.5 w-3.5" /> {program.enrollmentCounts.PENDING} بانتظار المراجعة
                    </Link>
                  )}
                </div>
              </td>

              <td className="p-4 text-left">
                <div className="flex items-center justify-start gap-2">
                  <Link
                    href={`/admin/content/${encodeURIComponent(program.slug)}`}
                    className="rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground p-2 transition-all"
                    title="إدارة المنهج"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => onEdit(program)}
                    className="rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white p-2 transition-all"
                    title="تعديل البرنامج"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(program)}
                    className="rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white p-2 transition-all"
                    title="حذف البرنامج"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
