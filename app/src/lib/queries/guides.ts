import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createGuide,
  deleteGuide,
  updateGuide,
  type GuideInput,
  getGuide,
  listGuides,
  type GuideCategory,
} from "@/lib/api/guides";
import { qk } from "@/lib/queries/keys";

export function useGuides(category?: GuideCategory) {
  return useQuery({
    queryKey: [...qk.guides, category ?? "all"],
    queryFn: ({ signal }) => listGuides(category, signal),
  });
}

export function useGuide(id: number) {
  return useQuery({
    queryKey: [...qk.guides, id],
    queryFn: ({ signal }) => getGuide(id, signal),
    enabled: Number.isFinite(id),
  });
}

export function useCreateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createGuide,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.guides }),
  });
}

export function useUpdateGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: number; body: GuideInput }) =>
      updateGuide(args.id, args.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.guides }),
  });
}

export function useDeleteGuide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteGuide(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.guides }),
  });
}
