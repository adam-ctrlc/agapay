import { apiRequest } from "@/lib/api/client";

export type HazardType = "earthquake" | "typhoon" | "flood" | "fire" | "other";

export type HazardEvent = {
  id: number;
  type: HazardType;
  source: string;
  title: string;
  place: string | null;
  magnitude: number | null;
  latitude: number | null;
  longitude: number | null;
  province_code: string | null;
  affected_people: number | null;
  severity: number;
  occurred_at: string | null;
};

export type HazardInput = {
  type: HazardType;
  title: string;
  place?: string | null;
  province_code?: string | null;
  affected_people?: number | null;
  severity: number;
  occurred_at?: string | null;
};

export async function listHazards(
  filters: { type?: string; province?: string } = {},
  signal?: AbortSignal,
) {
  const res = await apiRequest<{ data: HazardEvent[] }>("/hazards", {
    query: filters,
    auth: false,
    signal,
  });
  return res.data;
}

export async function createHazard(body: HazardInput) {
  const res = await apiRequest<{ data: HazardEvent }>("/hazards", {
    method: "POST",
    body,
  });
  return res.data;
}

export async function updateHazard(id: number, body: HazardInput) {
  const res = await apiRequest<{ data: HazardEvent }>(`/hazards/${id}`, {
    method: "PUT",
    body,
  });
  return res.data;
}

export function deleteHazard(id: number) {
  return apiRequest<{ message: string }>(`/hazards/${id}`, { method: "DELETE" });
}
