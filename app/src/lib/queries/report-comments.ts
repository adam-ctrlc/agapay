import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createReportComment,
  deleteReportComment,
  listReportComments,
} from "@/lib/api/report-comments";
import { qk } from "@/lib/queries/keys";

export function useReportComments(reportId: number, enabled = true) {
  return useQuery({
    queryKey: [...qk.reportComments, reportId],
    queryFn: ({ signal }) => listReportComments(reportId, signal),
    enabled,
  });
}

function useThreadInvalidation(reportId: number) {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({ queryKey: [...qk.reportComments, reportId] });
    qc.invalidateQueries({ queryKey: qk.incidentReports });
    qc.invalidateQueries({ queryKey: qk.notifications });
  };
}

export function useSendReportComment(reportId: number) {
  const invalidate = useThreadInvalidation(reportId);

  return useMutation({
    mutationFn: (body: string) => createReportComment(reportId, body),
    onSuccess: invalidate,
  });
}

export function useDeleteReportComment(reportId: number) {
  const invalidate = useThreadInvalidation(reportId);

  return useMutation({
    mutationFn: (id: number) => deleteReportComment(id),
    onSuccess: invalidate,
  });
}
