import { apiRequest } from "@/lib/api/client";

export type IncidentType =
  | "flood"
  | "fire"
  | "landslide"
  | "earthquake_damage"
  | "road_blocked"
  | "power_line_down"
  | "medical"
  | "sea_incident"
  | "security"
  | "other";

export type ReportStatus = "submitted" | "verified" | "dismissed" | "resolved";
export type LocationSource = "gps" | "manual_map" | "manual_province";
export type ReferralStatus = "suggested" | "referred" | "acknowledged" | "closed";

export type Referral = {
  id: number;
  agency: string;
  agency_label: string;
  agency_short: string;
  status: ReferralStatus;
  status_label: string;
  citizen_label: string;
  note: string | null;
  team?: { id: number; name: string; contact_number: string | null } | null;
  referred_at: string | null;
  acknowledged_at: string | null;
  closed_at: string | null;
};

export type IncidentReport = {
  id: number;
  type: IncidentType;
  type_label: string;
  status: ReportStatus;
  status_label: string;
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  province_code: string | null;
  province?: string | null;
  barangay?: string | null;
  location_source: LocationSource;
  location_label: string;
  is_precise: boolean;
  accuracy_meters: number | null;
  severity: number | null;
  has_photo: boolean;
  photo_thumbnail?: string;
  on_impact_map: boolean;
  reporter?: string | null;
  referrals?: Referral[];
  comment_count: number;
  reviewed_at: string | null;
  created_at: string | null;
};

export type IncidentReportInput = {
  type: IncidentType;
  title: string;
  description: string;
  location_source: LocationSource;
  latitude?: number | null;
  longitude?: number | null;
  province_code?: string | null;
  accuracy_meters?: number | null;
  photo_thumbnail?: string | null;
};

export async function listIncidentReports(
  filters: { status?: ReportStatus; type?: IncidentType } = {},
  signal?: AbortSignal,
) {
  const query: Record<string, string> = {};

  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;

  const res = await apiRequest<{ data: IncidentReport[] }>("/incident-reports", {
    query,
    signal,
  });
  return res.data;
}

export async function getIncidentReport(id: number, signal?: AbortSignal) {
  const res = await apiRequest<{ data: IncidentReport }>(
    `/incident-reports/${id}`,
    { signal },
  );
  return res.data;
}

export async function createIncidentReport(body: IncidentReportInput) {
  const res = await apiRequest<{ data: IncidentReport }>("/incident-reports", {
    method: "POST",
    body,
  });
  return res.data;
}

export async function reviewIncidentReport(
  id: number,
  body: { status?: ReportStatus; severity?: number | null },
) {
  const res = await apiRequest<{ data: IncidentReport }>(
    `/incident-reports/${id}`,
    { method: "PUT", body },
  );
  return res.data;
}

export async function promoteIncidentReport(id: number) {
  return apiRequest<{ message: string }>(`/incident-reports/${id}/promote`, {
    method: "POST",
  });
}

export async function deleteIncidentReport(id: number) {
  return apiRequest<{ message: string }>(`/incident-reports/${id}`, {
    method: "DELETE",
  });
}

export async function advanceReferral(
  id: number,
  body: { status: ReferralStatus; note?: string },
) {
  const res = await apiRequest<{ data: Referral }>(`/referrals/${id}`, {
    method: "PUT",
    body,
  });
  return res.data;
}
