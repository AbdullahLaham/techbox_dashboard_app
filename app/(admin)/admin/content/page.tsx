// app/(admin)/admin/content/page.tsx
'use client';

import { useState } from 'react';
import { Plus, Search, Loader2, BookOpen } from 'lucide-react';
import { useAdminPrograms, useCreateProgram, useDeleteProgram, useUpdateProgram } from '@/hooks/use-programs';
import { ProgramsTable } from '@/components/admin/programs-table';
import { ProgramModal } from '@/components/admin/program-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DashboardError } from '@/components/dashboard/shared/dashboard-states';
import { getApiErrorDetails, getApiErrorMessage } from '@/lib/api-error';
import type { Program, ProgramStatus } from '@/types/program';
import { PROGRAM_STATUSES, PROGRAM_STATUS_LABELS_AR, type CreateProgramBody } from '@/types/api.contract';

export default function AdminContentManagementPage() {
  const [modal, setModal] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });
  const [toDelete, setToDelete] = useState<Program | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<ProgramStatus | ''>('');

  const { data: programs, isLoading, isError, refetch } = useAdminPrograms(status ? { status } : {});
  const createMutation = useCreateProgram();
  const updateMutation = useUpdateProgram();
  const deleteMutation = useDeleteProgram();

  const saveMutation = modal.program ? updateMutation : createMutation;

  const openModal = (program: Program | null) => {
    createMutation.reset();
    updateMutation.reset();
    setModal({ open: true, program });
  };
  const closeModal = () => setModal({ open: false, program: null });

  const handleSubmit = (body: CreateProgramBody) => {
    if (modal.program) {
      updateMutation.mutate({ id: modal.program.id, body }, { onSuccess: closeModal });
    } else {
      createMutation.mutate(body, { onSuccess: closeModal });
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredPrograms = programs?.filter((p) => !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));

  return (
    <div className="space-y-8 pb-10" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold border border-gold/20">
            <BookOpen className="h-3.5 w-3.5" /> لوحة إدارة المناهج والبرامج
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">إدارة البرامج ومعسكرات التدريب</h1>
          <p className="text-sm text-muted-foreground">إنشاء البرامج بكل حالاتها (مسودة، منشور، جارٍ، منتهٍ، مؤرشف) وتحديد المقاعد ومواعيد الدفعة.</p>
        </div>
        <button
          onClick={() => openModal(null)}
          className="flex items-center gap-2 rounded-2xl bg-gold text-navy-900 hover:bg-gold/90 px-5 py-3 text-sm font-bold shadow-md transition-all"
        >
          <Plus className="h-4 w-4" /> إنشاء برنامج جديد
        </button>
      </div>

      {/* البحث والتصفية */}
      <div className="flex flex-col gap-3 bg-card p-4 rounded-2xl border shadow-sm sm:flex-row sm:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            aria-label="بحث"
            placeholder="البحث في البرامج بواسطة العنوان أو الرابط..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border bg-background py-2 pr-10 pl-4 text-xs focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <select
          aria-label="الحالة"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProgramStatus | '')}
          className="rounded-xl border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gold sm:w-48"
        >
          <option value="">كل الحالات</option>
          {PROGRAM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROGRAM_STATUS_LABELS_AR[s]}
            </option>
          ))}
        </select>
      </div>

      {/* الجدول */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-2xl border bg-card">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      ) : isError ? (
        <DashboardError onRetry={() => refetch()} />
      ) : (
        <ProgramsTable
          programs={filteredPrograms}
          onEdit={(program) => openModal(program)}
          onDelete={(program) => {
            deleteMutation.reset();
            setToDelete(program);
          }}
        />
      )}

      <ProgramModal
        isOpen={modal.open}
        program={modal.program}
        onClose={closeModal}
        onSubmit={handleSubmit}
        isPending={saveMutation.isPending}
        error={saveMutation.error ? getApiErrorMessage(saveMutation.error, 'تعذّر حفظ البرنامج.') : null}
        fieldErrors={saveMutation.error ? getApiErrorDetails(saveMutation.error) : undefined}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="حذف البرنامج"
        description={
          <>
            سيُحذف البرنامج <strong>{toDelete?.title}</strong> مع كل مساراته ودروسه نهائياً. لا يمكن حذف برنامج لديه طلبات تسجيل؛
            غيّر حالته إلى «مؤرشف» بدلاً من ذلك.
          </>
        }
        confirmLabel="حذف نهائي"
        tone="danger"
        pending={deleteMutation.isPending}
        error={deleteMutation.error ? getApiErrorMessage(deleteMutation.error, 'تعذّر حذف البرنامج.') : null}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
