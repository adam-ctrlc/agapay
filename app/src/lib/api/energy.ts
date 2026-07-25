import { apiRequest } from "@/lib/api/client";

export type GridIsland = "luzon" | "visayas" | "mindanao";
export type GridLevel = "normal" | "yellow" | "red";
export type InterruptionType = "rotating" | "scheduled" | "emergency" | "unplanned";
export type InterruptionStatus = "announced" | "active" | "restored" | "cancelled";
export type PowerStatus = "online" | "generator" | "offline";

export type GridStatus = {
  id: number;
  island: GridIsland;
  island_label: string;
  level: GridLevel;
  level_label: string;
  is_alert: boolean;
  demand_mw: number | null;
  capacity_mw: number | null;
  reserve_mw: number | null;
  source: string;
  note: string | null;
  observed_at: string | null;
};

export type PowerInterruption = {
  id: number;
  type: InterruptionType;
  type_label: string;
  is_planned: boolean;
  status: InterruptionStatus;
  utility: string;
  province_code: string | null;
  province?: string | null;
  barangay_id: number | null;
  barangay?: string | null;
  areas: string[];
  households_affected: number | null;
  source: string;
  starts_at: string;
  ends_at: string;
  is_active_now: boolean;
};

export type OutageProvince = {
  code: string;
  name: string;
  grid: GridIsland | null;
  households_affected: number;
  outage_minutes: number;
  interruption_count: number;
  is_active: boolean;
  next_interruption: {
    id: number;
    type: InterruptionType;
    utility: string;
    starts_at: string;
    ends_at: string;
    households_affected: number | null;
  } | null;
};

export async function listGridStatus(province?: string, signal?: AbortSignal) {
  const res = await apiRequest<{ data: GridStatus[] }>("/energy/grid", {
    query: province ? { province } : {},
    auth: false,
    signal,
  });
  return res.data;
}

export type InterruptionFilters = {
  province?: string;
  type?: InterruptionType;
  active?: boolean;
  upcoming?: boolean;
};

export async function listInterruptions(
  filters: InterruptionFilters = {},
  signal?: AbortSignal,
) {
  const query: Record<string, string | number> = {};

  if (filters.province) query.province = filters.province;
  if (filters.type) query.type = filters.type;
  if (filters.active) query.active = 1;
  if (filters.upcoming) query.upcoming = 1;

  const res = await apiRequest<{ data: PowerInterruption[] }>(
    "/energy/interruptions",
    { query, auth: false, signal },
  );
  return res.data;
}

export async function getOutageMap(hours = 24, signal?: AbortSignal) {
  const res = await apiRequest<{ data: OutageProvince[] }>("/heatmap/outages", {
    query: { hours },
    auth: false,
    signal,
  });
  return res.data;
}

export async function createInterruption(body: {
  type: InterruptionType;
  utility: string;
  province_code?: string;
  barangay_id?: number;
  areas?: string[];
  households_affected?: number;
  starts_at: string;
  ends_at: string;
}) {
  const res = await apiRequest<{ data: PowerInterruption }>(
    "/energy/interruptions",
    { method: "POST", body },
  );
  return res.data;
}

export async function updateInterruption(
  id: number,
  body: {
    type?: InterruptionType;
    utility?: string;
    barangay_id?: number;
    households_affected?: number;
    starts_at?: string;
    ends_at?: string;
  },
) {
  const res = await apiRequest<{ data: PowerInterruption }>(
    `/energy/interruptions/${id}`,
    { method: "PUT", body },
  );
  return res.data;
}

export async function deleteInterruption(id: number) {
  return apiRequest<{ message: string }>(`/energy/interruptions/${id}`, {
    method: "DELETE",
  });
}

export async function recordGridStatus(body: {
  island: GridIsland;
  capacity_mw: number;
  demand_mw: number;
  note?: string;
}) {
  const res = await apiRequest<{ data: GridStatus }>("/energy/grid", {
    method: "POST",
    body,
  });
  return res.data;
}
