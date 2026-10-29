// types/program.ts
// Program, curriculum and enrollment types. The shapes come from the API contract
// (types/api.contract.ts, copied from the backend); this file only gives them the names
// the UI uses and keeps the enum-style constants (ProgramType.BOOTCAMP, ...).
import type {
  AdminModule,
  AdminNode,
  AdminProgram,
  AdminProgramDetail,
  AdminTrack,
  CreateModuleBody,
  CreateNodeBody,
  CreateProgramBody,
  CreateTrackBody,
  NodeType as NodeTypeValue,
  ProgramDetail,
  ProgramNode,
  ProgramStatus as ProgramStatusValue,
  ProgramType as ProgramTypeValue,
  SubmissionType,
  UpdateModuleBody,
  UpdateNodeBody,
  UpdateProgramBody,
  UpdateTrackBody,
} from './api.contract';

export const ProgramType = {
  ACADEMIC_COURSE: 'ACADEMIC_COURSE',
  INCUBATOR_BATCH: 'INCUBATOR_BATCH',
  BOOTCAMP: 'BOOTCAMP',
  WORKSHOP_SERIES: 'WORKSHOP_SERIES',
} as const satisfies Record<ProgramTypeValue, ProgramTypeValue>;
export type ProgramType = ProgramTypeValue;

export const ProgramStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const satisfies Record<ProgramStatusValue, ProgramStatusValue>;
export type ProgramStatus = ProgramStatusValue;

export const NodeType = {
  VIDEO_LECTURE: 'VIDEO_LECTURE',
  LIVE_SESSION: 'LIVE_SESSION',
  ASSIGNMENT: 'ASSIGNMENT',
  READING_MATERIAL: 'READING_MATERIAL',
  QUIZ: 'QUIZ',
  MENTORSHIP_CHECKIN: 'MENTORSHIP_CHECKIN',
} as const satisfies Record<NodeTypeValue, NodeTypeValue>;
export type NodeType = NodeTypeValue;

export const AllowedSubmissionType = {
  FILE_UPLOAD: 'FILE_UPLOAD',
  URL_LINK: 'URL_LINK',
  TEXT_CONTENT: 'TEXT_CONTENT',
  MULTIMEDIA: 'MULTIMEDIA',
} as const satisfies Record<SubmissionType, SubmissionType>;
export type AllowedSubmissionType = SubmissionType;

/** Admin program row (GET /v1/admin/programs). */
export type Program = AdminProgram;
/** Admin program with its curriculum (GET /v1/admin/programs/:idOrSlug). */
export type ProgramWithCurriculum = AdminProgramDetail;
export type Track = AdminTrack;
export type Module = AdminModule;
/** A lesson as the curriculum editor sees it. */
export type ActivityNode = AdminNode;

/** Public program detail (GET /v1/programs/:slug) and its lessons, for the learner pages. */
export type PublicProgram = ProgramDetail;
export type PublicNode = ProgramNode;

export type CreateProgramDto = CreateProgramBody;
export type UpdateProgramDto = UpdateProgramBody;
export type CreateTrackDto = CreateTrackBody;
export type UpdateTrackDto = UpdateTrackBody;
export type CreateModuleDto = CreateModuleBody;
export type UpdateModuleDto = UpdateModuleBody;
export type CreateNodeDto = CreateNodeBody;
export type UpdateNodeDto = UpdateNodeBody;
