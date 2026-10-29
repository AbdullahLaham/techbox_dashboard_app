// lib/grading.ts
// Links between the grading screens.

/** The review queue, optionally opened on one assignment. */
export function gradingHref(assignmentId?: string): string {
  return assignmentId ? `/admin/grading?assignment=${encodeURIComponent(assignmentId)}` : '/admin/grading';
}

/** One hand-in with its grading form. */
export function submissionHref(submissionId: string): string {
  return `/admin/grading/${encodeURIComponent(submissionId)}`;
}
