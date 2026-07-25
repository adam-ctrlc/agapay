import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createInterruption,
  deleteInterruption,
  getOutageMap,
  listGridStatus,
  listInterruptions,
  recordGridStatus,
  updateInterruption,
  type InterruptionFilters,
} from "@/lib/api/energy";
import { qk } from "@/lib/queries/keys";

export function useGridStatus(province?: string) {
  return useQuery({
    queryKey: [...qk.energyGrid, province ?? "all"],
    queryFn: ({ signal }) => listGridStatus(province, signal),
    staleTime: 60 * 1000,
  });
}

export function useInterruptions(filters: InterruptionFilters = {}) {
  return useQuery({
    queryKey: [...qk.interruptions, filters],
    queryFn: ({ signal }) => listInterruptions(filters, signal),
  });
}

export function useOutageMap(hours = 24) {
  return useQuery({
    queryKey: [...qk.outageMap, hours],
    queryFn: ({ signal }) => getOutageMap(hours, signal),
  });
}

export function useCreateInterruption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createInterruption,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.interruptions });
      qc.invalidateQueries({ queryKey: qk.outageMap });
      qc.invalidateQueries({ queryKey: qk.locations });
    },
  });
}

function useEnergyInvalidation() {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({ queryKey: qk.interruptions });
    qc.invalidateQueries({ queryKey: qk.outageMap });
    qc.invalidateQueries({ queryKey: qk.locations });
  };
}

export function useUpdateInterruption() {
  const invalidate = useEnergyInvalidation();
  return useMutation({
    mutationFn: (args: {
      id: number;
      body: Parameters<typeof updateInterruption>[1];
    }) => updateInterruption(args.id, args.body),
    onSuccess: invalidate,
  });
}

export function useDeleteInterruption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteInterruption,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.interruptions });
      qc.invalidateQueries({ queryKey: qk.outageMap });
      qc.invalidateQueries({ queryKey: qk.locations });
    },
  });
}

export function useRecordGridStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordGridStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.energyGrid }),
  });
}
