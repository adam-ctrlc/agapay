import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createHazard,
  deleteHazard,
  listHazards,
  updateHazard,
  type HazardInput,
} from "@/lib/api/hazards";
import { qk } from "@/lib/queries/keys";

export function useHazards(filters: { type?: string; province?: string } = {}) {
  return useQuery({
    queryKey: [...qk.hazards, filters.type ?? "all", filters.province ?? "all"],
    queryFn: ({ signal }) => listHazards(filters, signal),
  });
}

export function useCreateHazard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHazard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.hazards });
      qc.invalidateQueries({ queryKey: qk.impactMap });
    },
  });
}

export function useUpdateHazard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: number; body: HazardInput }) =>
      updateHazard(args.id, args.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.hazards });
      qc.invalidateQueries({ queryKey: qk.impactMap });
    },
  });
}

export function useDeleteHazard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteHazard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.hazards });
      qc.invalidateQueries({ queryKey: qk.impactMap });
    },
  });
}
