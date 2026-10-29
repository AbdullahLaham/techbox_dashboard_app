// services/enrollment-service.ts
// Enrollment applications (types/api.contract.ts, "Enrollments").
import { apiClient } from '@/services/auth-service';
import {
  API_ENDPOINTS,
  type AdminEnrollmentDetail,
  type AdminEnrollmentList,
  type AdminEnrollmentListQuery,
  type EnrollmentApplicationFields,
  type MyEnrollment,
  type UpdateEnrollmentStatusBody,
} from '@/types/api.contract';

export const enrollmentService = {
  /* ------------------------------ Learner ----------------------------- */

  /** Apply (or apply again after a rejection) with the personal data and an optional payment receipt. */
  async apply(programId: string, fields: EnrollmentApplicationFields, receipt?: File | null): Promise<MyEnrollment> {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
    if (receipt) form.append('receipt', receipt);
    const res = await apiClient.post<MyEnrollment>(API_ENDPOINTS.enroll(programId), form, {
      // The shared instance defaults to JSON; this keeps the body multipart (the browser adds the boundary).
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    });
    return res.data;
  },

  async getMyEnrollments(): Promise<MyEnrollment[]> {
    const res = await apiClient.get<MyEnrollment[]>(API_ENDPOINTS.myEnrollments);
    return res.data;
  },

  /* ------------------------------- Admin ------------------------------ */

  async list(query: AdminEnrollmentListQuery, signal?: AbortSignal): Promise<AdminEnrollmentList> {
    const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ''));
    const res = await apiClient.get<AdminEnrollmentList>(API_ENDPOINTS.adminEnrollments, { params, signal });
    return res.data;
  },

  async get(id: string, signal?: AbortSignal): Promise<AdminEnrollmentDetail> {
    const res = await apiClient.get<AdminEnrollmentDetail>(API_ENDPOINTS.adminEnrollment(id), { signal });
    return res.data;
  },

  async changeStatus(id: string, body: UpdateEnrollmentStatusBody): Promise<AdminEnrollmentDetail> {
    const res = await apiClient.patch<AdminEnrollmentDetail>(API_ENDPOINTS.adminEnrollmentStatus(id), body);
    return res.data;
  },
};
