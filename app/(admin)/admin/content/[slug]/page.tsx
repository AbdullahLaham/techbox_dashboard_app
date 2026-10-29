// app/(admin)/admin/content/[slug]/page.tsx
'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Video, FileText, ArrowRight, Loader2, FolderPlus, FilePlus, Edit, Trash2, ExternalLink, BookOpen, ListChecks } from 'lucide-react';
import {
  useAdminProgram,
  useCreateTrack,
  useUpdateTrack,
  useDeleteTrack,
  useCreateModule,
  useUpdateModule,
  useDeleteModule,
  useCreateNode,
  useUpdateNode,
  useDeleteNode,
} from '@/hooks/use-programs';
import { useCreateLesson, useDeleteLesson } from '@/hooks/use-admin-nodes';
import { NodeType } from '@/types/program';
import { NODE_TYPE_LABELS_AR, PROGRAM_STATUS_LABELS_AR } from '@/types/api.contract';
import {
  CurriculumModal,
  type CurriculumEntity,
  type CurriculumInitialData,
  type CurriculumMode,
  type CurriculumSubmitPayload,
} from '@/components/admin/curriculum-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { DashboardError } from '@/components/dashboard/shared/dashboard-states';
import { ASSIGNMENT_STATUS_LABELS, PROGRAM_TYPE_LABELS } from '@/lib/labels';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { lessonHref } from '@/lib/lessons';
import { MANAGED_NODE_TYPES, type ManagedNodeType } from '@/types/nodes.contract';

type ModalState = {
  isOpen: boolean;
  type: CurriculumEntity | null;
  mode: CurriculumMode;
  targetId?: string;
  initialData?: CurriculumInitialData;
};

/** `managed`: a lesson type owned by the lessons API (video, reading, quiz), deleted through it. */
type DeleteTarget = { kind: CurriculumEntity; id: string; title: string; managed?: boolean };

/** Video, reading and quiz lessons are created and edited with the lessons API (/v1/admin/nodes). */
function isManagedType(type: NodeType): type is ManagedNodeType {
  return (MANAGED_NODE_TYPES as readonly NodeType[]).includes(type);
}

const NODE_ICONS: Partial<Record<NodeType, { icon: React.ComponentType<{ className?: string }>; className: string }>> = {
  [NodeType.VIDEO_LECTURE]: { icon: Video, className: 'text-blue-500' },
  [NodeType.READING_MATERIAL]: { icon: BookOpen, className: 'text-emerald-500' },
  [NodeType.QUIZ]: { icon: ListChecks, className: 'text-violet-500' },
};

const DELETE_COPY: Record<CurriculumEntity, string> = {
  TRACK: 'سيُحذف المسار بكل وحداته ودروسه.',
  MODULE: 'ستُحذف الوحدة بكل دروسها.',
  NODE: 'سيُحذف الدرس نهائياً.',
};

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function AdminCurriculumBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = decodeParam(use(params).slug);
  const router = useRouter();
  const { data: program, isLoading, isError, refetch } = useAdminProgram(slug);

  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, mode: 'CREATE' });
  const [toDelete, setToDelete] = useState<DeleteTarget | null>(null);

  const createTrack = useCreateTrack();
  const updateTrack = useUpdateTrack();
  const deleteTrack = useDeleteTrack();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const createNode = useCreateNode();
  const updateNode = useUpdateNode();
  const deleteNode = useDeleteNode();
  const createLesson = useCreateLesson();
  const deleteLesson = useDeleteLesson();

  const saveMutations = [createTrack, updateTrack, createModule, updateModule, createNode, updateNode, createLesson];
  const saveError = saveMutations.find((m) => m.error)?.error;
  const deleteMutation =
    toDelete?.kind === 'TRACK'
      ? deleteTrack
      : toDelete?.kind === 'MODULE'
        ? deleteModule
        : toDelete?.managed
          ? deleteLesson
          : deleteNode;
  const deleteError = deleteMutation.error
    ? getApiErrorCode(deleteMutation.error) === 'QUIZ_HAS_ATTEMPTS'
      ? 'قدّم الطلاب محاولات على اختبار داخل هذا المحتوى، ولا يمكن حذفه حتى لا تضيع نتائجهم.'
      : getApiErrorMessage(deleteMutation.error, 'تعذّر الحذف.')
    : null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (isError && !program) {
    return <DashboardError onRetry={() => refetch()} />;
  }

  if (!program) {
    return (
      <div className="p-8 text-center space-y-4" dir="rtl">
        <h2 className="text-xl font-bold">البرنامج غير موجود</h2>
        <Link href="/admin/content" className="text-xs text-gold underline">العودة إلى إدارة البرامج</Link>
      </div>
    );
  }

  const openModal = (state: Omit<ModalState, 'isOpen'>) => {
    saveMutations.forEach((m) => m.reset());
    setModalState({ ...state, isOpen: true });
  };
  const closeModal = () => setModalState({ isOpen: false, type: null, mode: 'CREATE' });

  const handleModalSubmit = (payload: CurriculumSubmitPayload) => {
    const { mode, targetId } = modalState;
    const done = { onSuccess: closeModal };

    if (payload.kind === 'TRACK') {
      if (mode === 'CREATE') createTrack.mutate({ programId: program.id, body: payload.dto }, done);
      else if (targetId) updateTrack.mutate({ trackId: targetId, body: payload.dto }, done);
      return;
    }
    if (!targetId) return;
    if (payload.kind === 'MODULE') {
      if (mode === 'CREATE') createModule.mutate({ trackId: targetId, body: payload.dto }, done);
      else updateModule.mutate({ moduleId: targetId, body: payload.dto }, done);
      return;
    }

    const { dto, link } = payload;
    const lessonType = dto.type;
    if (mode === 'CREATE' && isManagedType(lessonType)) {
      createLesson.mutate(
        {
          moduleId: targetId,
          type: lessonType,
          title: dto.title,
          description: dto.description,
          isMandatory: dto.isMandatory,
          ...(dto.videoData && { video: dto.videoData }),
          ...(link && { link }),
        },
        {
          // Quizzes need questions and reading lessons without a link need a file: continue in the editor.
          onSuccess: (node) =>
            node.type === 'VIDEO_LECTURE' || node.resource ? closeModal() : router.push(lessonHref(node.id, { program: program.slug })),
        },
      );
    } else if (mode === 'CREATE') {
      createNode.mutate({ moduleId: targetId, body: dto }, done);
    } else {
      updateNode.mutate({ nodeId: targetId, body: dto }, done);
    }
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const done = { onSuccess: () => setToDelete(null) };
    if (toDelete.kind === 'TRACK') deleteTrack.mutate(toDelete.id, done);
    else if (toDelete.kind === 'MODULE') deleteModule.mutate(toDelete.id, done);
    else if (toDelete.managed) deleteLesson.mutate(toDelete.id, done);
    else deleteNode.mutate(toDelete.id, done);
  };

  const askDelete = (target: DeleteTarget) => {
    [deleteTrack, deleteModule, deleteNode, deleteLesson].forEach((m) => m.reset());
    setToDelete(target);
  };

  return (
    <div className="space-y-8 pb-10" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin/content" className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline mb-2 font-semibold">
            <ArrowRight className="h-3.5 w-3.5" /> العودة لقائمة البرامج
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{program.title}</h1>
            <Badge variant="gold">{PROGRAM_TYPE_LABELS[program.type]}</Badge>
            <Badge variant="muted">{PROGRAM_STATUS_LABELS_AR[program.status]}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">إدارة الهيكل الهرمي الكامل للمنهج (مسارات، وحدات، ودروس مرئية أو واجبات).</p>
        </div>

        <button
          onClick={() => openModal({ type: 'TRACK', mode: 'CREATE' })}
          className="flex items-center gap-2 rounded-2xl bg-gold text-navy-900 px-5 py-3 text-xs font-bold shadow-md hover:bg-gold/90 transition-all"
        >
          <Plus className="h-4 w-4" /> إضافة مسار تعليمي جديد
        </button>
      </div>

      {program.tracks.length === 0 && (
        <div className="rounded-3xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          لا توجد مسارات بعد. ابدأ بإضافة مسار، ثم وحدات ودروس داخله.
        </div>
      )}

      {/* شجرة المنهج الدراسي */}
      <div className="space-y-6">
        {program.tracks.map((track, trackIdx) => (
          <div key={track.id} className="rounded-3xl border bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-0.5 rounded-full">
                  المسار رقم {trackIdx + 1}
                </span>
                <h3 className="font-bold text-lg text-foreground">{track.title}</h3>
                {track.description && <p className="text-xs text-muted-foreground">{track.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal({ type: 'MODULE', mode: 'CREATE', targetId: track.id })}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 text-xs font-bold transition-all"
                >
                  <FolderPlus className="h-3.5 w-3.5" /> إضافة وحدة
                </button>
                <button
                  onClick={() => openModal({ type: 'TRACK', mode: 'EDIT', targetId: track.id, initialData: track })}
                  className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                  title="تعديل المسار"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => askDelete({ kind: 'TRACK', id: track.id, title: track.title })}
                  className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                  title="حذف المسار"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* الوحدات داخل المسار */}
            <div className="space-y-4 pr-4 sm:pr-6 border-r-2 border-border mr-2">
              {track.modules.map((mod, modIdx) => (
                <div key={mod.id} className="rounded-2xl border bg-muted/20 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground">الوحدة {modIdx + 1}</span>
                      <h4 className="font-bold text-sm text-foreground">{mod.title}</h4>
                      {mod.description && <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal({ type: 'NODE', mode: 'CREATE', targetId: mod.id })}
                        className="flex items-center gap-1 rounded-xl bg-gold/15 text-gold hover:bg-gold hover:text-navy-900 px-3 py-1.5 text-xs font-bold transition-all"
                      >
                        <FilePlus className="h-3.5 w-3.5" /> إضافة درس
                      </button>
                      <button
                        onClick={() => openModal({ type: 'MODULE', mode: 'EDIT', targetId: mod.id, initialData: mod })}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                        title="تعديل الوحدة"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => askDelete({ kind: 'MODULE', id: mod.id, title: mod.title })}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                        title="حذف الوحدة"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* الدروس داخل الوحدة */}
                  <div className="grid gap-3 sm:grid-cols-2 pt-2">
                    {mod.nodes.map((node) => {
                      const managed = isManagedType(node.type);
                      const editorHref = lessonHref(node.id, { program: program.slug });
                      const { icon: NodeIcon, className: iconClass } = NODE_ICONS[node.type] ?? { icon: FileText, className: 'text-amber-500' };
                      return (
                      <div key={node.id} className="flex items-center justify-between gap-2 rounded-2xl border bg-card p-3.5 shadow-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <NodeIcon className={`h-4 w-4 shrink-0 ${iconClass}`} />
                          <div className="min-w-0">
                            {managed ? (
                              <Link href={editorHref} className="text-xs font-bold truncate block text-foreground hover:text-gold">
                                {node.title}
                              </Link>
                            ) : (
                              <span className="text-xs font-bold truncate block text-foreground">{node.title}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{NODE_TYPE_LABELS_AR[node.type]}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {node.assignment && (
                            <Link
                              href={`/admin/assignments/${node.assignment.id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-gold hover:underline"
                              title="إدارة الواجب (النشر والمرفقات)"
                            >
                              {ASSIGNMENT_STATUS_LABELS[node.assignment.status]} <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${node.isMandatory ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
                            {node.isMandatory ? 'إلزامي' : 'اختياري'}
                          </span>
                          {managed ? (
                            <Link
                              href={editorHref}
                              className="p-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                              title={node.type === NodeType.QUIZ ? 'تحرير الاختبار وأسئلته' : 'تحرير الدرس'}
                              aria-label={`تحرير ${node.title}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Link>
                          ) : (
                            <button
                              onClick={() => openModal({ type: 'NODE', mode: 'EDIT', targetId: node.id, initialData: node })}
                              className="p-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-all"
                              title="تعديل الدرس"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => askDelete({ kind: 'NODE', id: node.id, title: node.title, managed })}
                            className="p-1 rounded bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                            title="حذف الدرس"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* نافذة الحوار الموحدة للـ CRUD */}
      <CurriculumModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        mode={modalState.mode}
        initialData={modalState.initialData}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        isPending={saveMutations.some((m) => m.isPending)}
        error={saveError ? getApiErrorMessage(saveError, 'تعذّر الحفظ.') : null}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="تأكيد الحذف"
        description={
          <>
            <strong>{toDelete?.title}</strong>: {toDelete ? DELETE_COPY[toDelete.kind] : ''} لا يمكن الحذف إذا سلّم الطلاب واجبات أو قدّموا محاولات على اختبارات داخله.
          </>
        }
        confirmLabel="حذف"
        tone="danger"
        pending={deleteMutation.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
