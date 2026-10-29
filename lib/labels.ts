// lib/labels.ts
// Arabic display labels for domain enums.
import { NodeType, ProgramType } from '@/types/program';
import { StartupStage } from '@/types/dashboard';
import type { AssignmentBucket, AssignmentState, SubmissionStatus, SubmissionType } from '@/types/assignments.contract';
import type { AssignmentStatus } from '@/types/assignments.admin.contract';

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  [ProgramType.ACADEMIC_COURSE]: 'مساق أكاديمي',
  [ProgramType.INCUBATOR_BATCH]: 'دفعة احتضان',
  [ProgramType.BOOTCAMP]: 'معسكر تدريبي',
  [ProgramType.WORKSHOP_SERIES]: 'سلسلة ورش',
};

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  [NodeType.VIDEO_LECTURE]: 'محاضرة مسجّلة',
  [NodeType.LIVE_SESSION]: 'جلسة مباشرة',
  [NodeType.ASSIGNMENT]: 'واجب',
  [NodeType.READING_MATERIAL]: 'مادة قرائية',
  [NodeType.QUIZ]: 'اختبار',
  [NodeType.MENTORSHIP_CHECKIN]: 'جلسة إرشاد',
};

export const STARTUP_STAGE_LABELS: Record<StartupStage, string> = {
  [StartupStage.IDEATION]: 'بلورة الفكرة',
  [StartupStage.VALIDATION]: 'التحقق من السوق',
  [StartupStage.MVP]: 'بناء المنتج الأولي',
  [StartupStage.GROWTH]: 'النمو',
  [StartupStage.INVESTMENT_READY]: 'جاهز للاستثمار',
};

export const SUBMISSION_TYPE_LABELS: Record<SubmissionType, string> = {
  FILE_UPLOAD: 'رفع ملف',
  URL_LINK: 'رابط خارجي',
  TEXT_CONTENT: 'نص مكتوب',
  MULTIMEDIA: 'وسائط متعددة',
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  DRAFT: 'مسودة',
  PUBLISHED: 'منشور',
  ARCHIVED: 'مؤرشف',
};

export const ASSIGNMENT_STATE_LABELS: Record<AssignmentState, string> = {
  NOT_SUBMITTED: 'لم يُسلَّم',
  AWAITING_REVIEW: 'بانتظار التقييم',
  NEEDS_REVISION: 'يحتاج تعديلاً',
  GRADED: 'تم التقييم',
  REJECTED: 'مرفوض',
};

export const ASSIGNMENT_BUCKET_LABELS: Record<AssignmentBucket, string> = {
  TODO: 'لم تُسلَّم',
  SUBMITTED: 'تم التسليم',
  DONE: 'مكتملة',
};

/** Status of one hand-in as reviewers and students see it. */
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  SUBMITTED: 'بانتظار التقييم',
  UNDER_REVIEW: 'قيد المراجعة',
  NEEDS_REVISION: 'يحتاج تعديلاً',
  GRADED: 'تم التقييم',
  REJECTED: 'مرفوض',
};
