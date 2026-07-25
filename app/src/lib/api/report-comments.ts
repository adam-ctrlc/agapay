import { apiRequest } from "@/lib/api/client";
import type { UserRole } from "@/lib/api/auth";

export type ReportComment = {
  id: number;
  body: string;
  is_official: boolean;
  is_mine: boolean;
  author: { id: number | null; name: string; role: UserRole | null };
  created_at: string | null;
};

export async function listReportComments(
  reportId: number,
  signal?: AbortSignal,
) {
  const res = await apiRequest<{ data: ReportComment[] }>(
    `/incident-reports/${reportId}/comments`,
    { signal },
  );
  return res.data;
}

export async function createReportComment(reportId: number, body: string) {
  const res = await apiRequest<{ data: ReportComment }>(
    `/incident-reports/${reportId}/comments`,
    { method: "POST", body: { body } },
  );
  return res.data;
}

export async function deleteReportComment(id: number) {
  return apiRequest<{ message: string }>(`/incident-report-comments/${id}`, {
    method: "DELETE",
  });
}
