// services/program-service.ts
// Programs and curriculum (types/api.contract.ts). The public reads send the Bearer token
// when signed in (apiClient interceptor), which adds the learner's enrollment and unlocks content.
import { apiClient } from '@/services/auth-service';
import {
  API_ENDPOINTS,
  type AdminModule,
  type AdminNode,
  type AdminProgram,
  type AdminProgramDetail,
  type AdminProgramListQuery,
  type AdminTrack,
  type CreateModuleBody,
  type CreateNodeBody,
  type CreateProgramBody,
  type CreateTrackBody,
  type ProgramDetail,
  type ProgramSummary,
  type UpdateModuleBody,
  type UpdateNodeBody,
  type UpdateProgramBody,
  type UpdateTrackBody,
} from '@/types/api.contract';

export const programService = {
  /* ------------------------------ Public ------------------------------ */

  /** Catalog: PUBLISHED and ONGOING programs. */
  async getCatalog(): Promise<ProgramSummary[]> {
    const res = await apiClient.get<ProgramSummary[]>(API_ENDPOINTS.programs);
    return res.data;
  },

  /** Curriculum with the caller's enrollment; lessons are locked until the enrollment is accepted. */
  async getProgramBySlug(slug: string): Promise<ProgramDetail> {
    const res = await apiClient.get<ProgramDetail>(API_ENDPOINTS.program(slug));
    return res.data;
  },

  /* ------------------------------ Admin ------------------------------- */

  /** Every program in any status (drafts included). */
  async listAdminPrograms(query: AdminProgramListQuery = {}): Promise<AdminProgram[]> {
    const res = await apiClient.get<AdminProgram[]>(API_ENDPOINTS.adminPrograms, { params: query });
    return res.data;
  },

  /** By id or slug, any status, with the full curriculum. */
  async getAdminProgram(idOrSlug: string): Promise<AdminProgramDetail> {
    const res = await apiClient.get<AdminProgramDetail>(API_ENDPOINTS.adminProgram(idOrSlug));
    return res.data;
  },

  async createProgram(body: CreateProgramBody): Promise<AdminProgram> {
    const res = await apiClient.post<AdminProgram>(API_ENDPOINTS.adminPrograms, body);
    return res.data;
  },

  async updateProgram(id: string, body: UpdateProgramBody): Promise<AdminProgram> {
    const res = await apiClient.patch<AdminProgram>(API_ENDPOINTS.adminProgram(id), body);
    return res.data;
  },

  /** Refused (409 PROGRAM_HAS_ENROLLMENTS) once someone applied: archive instead. */
  async deleteProgram(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.adminProgram(id));
  },

  async createTrack(programId: string, body: CreateTrackBody): Promise<AdminTrack> {
    const res = await apiClient.post<AdminTrack>(API_ENDPOINTS.adminProgramTracks(programId), body);
    return res.data;
  },

  async updateTrack(trackId: string, body: UpdateTrackBody): Promise<AdminTrack> {
    const res = await apiClient.patch<AdminTrack>(API_ENDPOINTS.adminTrack(trackId), body);
    return res.data;
  },

  async deleteTrack(trackId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.adminTrack(trackId));
  },

  async createModule(trackId: string, body: CreateModuleBody): Promise<AdminModule> {
    const res = await apiClient.post<AdminModule>(API_ENDPOINTS.adminTrackModules(trackId), body);
    return res.data;
  },

  async updateModule(moduleId: string, body: UpdateModuleBody): Promise<AdminModule> {
    const res = await apiClient.patch<AdminModule>(API_ENDPOINTS.adminModule(moduleId), body);
    return res.data;
  },

  async deleteModule(moduleId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.adminModule(moduleId));
  },

  async createNode(moduleId: string, body: CreateNodeBody): Promise<AdminNode> {
    const res = await apiClient.post<AdminNode>(API_ENDPOINTS.adminModuleNodes(moduleId), body);
    return res.data;
  },

  async updateNode(nodeId: string, body: UpdateNodeBody): Promise<AdminNode> {
    const res = await apiClient.patch<AdminNode>(API_ENDPOINTS.adminNode(nodeId), body);
    return res.data;
  },

  async deleteNode(nodeId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.adminNode(nodeId));
  },
};
