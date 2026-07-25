import { apiRequest } from "@/lib/api/client";
import type { User } from "@/lib/api/auth";

export type MerchantAccount = User & {
  location?: { id: number; name: string; type: string } | null;
};

export type MerchantFilter = "pending" | "approved" | "all";

export async function listMerchants(
  status: MerchantFilter = "all",
  signal?: AbortSignal,
) {
  const res = await apiRequest<{ data: MerchantAccount[] }>("/merchants", {
    query: status === "all" ? {} : { status },
    signal,
  });
  return res.data;
}

export async function approveMerchant(id: number) {
  const res = await apiRequest<{ data: MerchantAccount }>(
    `/merchants/${id}/approve`,
    { method: "POST" },
  );
  return res.data;
}

export async function revokeMerchant(id: number) {
  const res = await apiRequest<{ data: MerchantAccount }>(
    `/merchants/${id}/revoke`,
    { method: "POST" },
  );
  return res.data;
}
