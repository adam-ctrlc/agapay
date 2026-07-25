import { useQuery } from "@tanstack/react-query";

import {
  listLocations,
  listSignupLocations,
  type LocationFilters,
} from "@/lib/api/locations";
import { qk } from "@/lib/queries/keys";

export function useLocations(filters: LocationFilters = {}, enabled = true) {
  return useQuery({
    queryKey: [...qk.locations, filters],
    queryFn: ({ signal }) => listLocations(filters, signal),
    enabled,
  });
}

export function useSignupLocations(enabled = true) {
  return useQuery({
    queryKey: [...qk.locations, "signup"],
    queryFn: ({ signal }) => listSignupLocations(signal),
    enabled,
  });
}
