import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  advanceReferral,
  createIncidentReport,
  deleteIncidentReport,
  getIncidentReport,
  listIncidentReports,
  promoteIncidentReport,
  reviewIncidentReport,
  type IncidentReportInput,
  type IncidentType,
  type ReferralStatus,
  type ReportStatus,
} from "@/lib/api/incident-reports";
import { qk } from "@/lib/queries/keys";

export function useIncidentReports(
  filters: { status?: ReportStatus; type?: IncidentType } = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [...qk.incidentReports, filters],
    queryFn: ({ signal }) => listIncidentReports(filters, signal),
    enabled,
  });
}

export function useIncidentReport(id: number) {
  return useQuery({
    queryKey: [...qk.incidentReports, id],
    queryFn: ({ signal }) => getIncidentReport(id, signal),
  });
}

function useReportInvalidation() {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({ queryKey: qk.incidentReports });
    qc.invalidateQueries({ queryKey: qk.hazards });
    qc.invalidateQueries({ queryKey: qk.impactMap });
    qc.invalidateQueries({ queryKey: qk.notifications });
  };
}

export function useCreateIncidentReport() {
  const invalidate = useReportInvalidation();
  return useMutation({
    mutationFn: (body: IncidentReportInput) => createIncidentReport(body),
    onSuccess: invalidate,
  });
}

export function useReviewIncidentReport() {
  const invalidate = useReportInvalidation();
  return useMutation({
    mutationFn: (args: {
      id: number;
      status?: ReportStatus;
      severity?: number | null;
    }) => reviewIncidentReport(args.id, { status: args.status, severity: args.severity }),
    onSuccess: invalidate,
  });
}

export function usePromoteIncidentReport() {
  const invalidate = useReportInvalidation();
  return useMutation({
    mutationFn: (id: number) => promoteIncidentReport(id),
    onSuccess: invalidate,
  });
}

export function useDeleteIncidentReport() {
  const invalidate = useReportInvalidation();
  return useMutation({
    mutationFn: (id: number) => deleteIncidentReport(id),
    onSuccess: invalidate,
  });
}

export function useAdvanceReferral() {
  const invalidate = useReportInvalidation();
  return useMutation({
    mutationFn: (args: { id: number; status: ReferralStatus; note?: string }) =>
      advanceReferral(args.id, { status: args.status, note: args.note }),
    onSuccess: invalidate,
  });
}
