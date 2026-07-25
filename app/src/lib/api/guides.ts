import { apiRequest } from "@/lib/api/client";

export type GuideCategory =
  | "id"
  | "benefit"
  | "document"
  | "relief"
  | "tax"
  | "work"
  | "business"
  | "travel";

export type ServiceGuide = {
  id: number;
  category: GuideCategory;
  agency: string;
  title: string;
  summary: string;
  requirements: string[];
  steps: string[];
  where_to_go: string;
  fees: string | null;
  notes: string | null;
  source_url: string | null;
  effective_date: string | null;
  updated_at: string | null;
};

export type GuideInput = {
  category: GuideCategory;
  agency: string;
  title: string;
  summary: string;
  requirements: string[];
  steps: string[];
  where_to_go: string;
  fees?: string | null;
  notes?: string | null;
  source_url?: string | null;
};

export async function listGuides(
  category?: GuideCategory,
  signal?: AbortSignal,
) {
  const res = await apiRequest<{ data: ServiceGuide[] }>("/guides", {
    query: category ? { category } : {},
    auth: false,
    signal,
  });
  return res.data;
}

export async function getGuide(id: number, signal?: AbortSignal) {
  const res = await apiRequest<{ data: ServiceGuide }>(`/guides/${id}`, {
    auth: false,
    signal,
  });
  return res.data;
}

export async function createGuide(body: GuideInput) {
  const res = await apiRequest<{ data: ServiceGuide }>("/guides", {
    method: "POST",
    body,
  });
  return res.data;
}

export async function updateGuide(id: number, body: GuideInput) {
  const res = await apiRequest<{ data: ServiceGuide }>(`/guides/${id}`, {
    method: "PUT",
    body,
  });
  return res.data;
}

export function deleteGuide(id: number) {
  return apiRequest<{ message: string }>(`/guides/${id}`, {
    method: "DELETE",
  });
}
