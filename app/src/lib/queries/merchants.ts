import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveMerchant,
  listMerchants,
  revokeMerchant,
  type MerchantFilter,
} from "@/lib/api/merchants";
import { qk } from "@/lib/queries/keys";

export function useMerchants(status: MerchantFilter = "all") {
  return useQuery({
    queryKey: [...qk.merchants, status],
    queryFn: ({ signal }) => listMerchants(status, signal),
  });
}

function useMerchantInvalidation() {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({ queryKey: qk.merchants });
    qc.invalidateQueries({ queryKey: qk.notifications });
  };
}

export function useApproveMerchant() {
  const invalidate = useMerchantInvalidation();

  return useMutation({
    mutationFn: (id: number) => approveMerchant(id),
    onSuccess: invalidate,
  });
}

export function useRevokeMerchant() {
  const invalidate = useMerchantInvalidation();

  return useMutation({
    mutationFn: (id: number) => revokeMerchant(id),
    onSuccess: invalidate,
  });
}
