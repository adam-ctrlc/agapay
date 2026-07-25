import { View } from "react-native";
import { ClockCounterClockwise } from "phosphor-react-native";

import type { AllocationStatus } from "@/lib/api/allocations";
import { useAllocations } from "@/lib/queries/allocations";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type BadgeVariant = "accent" | "success" | "destructive" | "muted";

const STATUS: Record<AllocationStatus, { label: string; variant: BadgeVariant }> =
  {
    locked: { label: "Ready to claim", variant: "accent" },
    redeemed: { label: "Claimed", variant: "success" },
    expired: { label: "Expired", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "muted" },
  };

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function dateLabel(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function ClaimHistory() {
  const allocations = useAllocations();

  if (allocations.isLoading) {
    return (
      <View className="gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </View>
    );
  }

  if (allocations.isError) {
    return <Text className="text-destructive">Couldn&apos;t load your history.</Text>;
  }

  if ((allocations.data ?? []).length === 0) {
    return (
      <EmptyState
        icon={ClockCounterClockwise}
        title="No claims yet"
        description="Once you redeem a voucher at a store, it shows up here with the date and quantity."
      />
    );
  }

  return (
    <View className="gap-3">
      {allocations.data?.map((a) => {
        const status = STATUS[a.status];
        return (
          <Card key={a.id} className="flex-row items-center justify-between">
            <View className="flex-1 gap-0.5 pr-2">
              <Text variant="label">{a.commodity?.name ?? "Relief goods"}</Text>
              <Text variant="caption">{a.location?.name ?? ""}</Text>
              {a.created_at ? (
                <Text variant="caption">{dateLabel(a.created_at)}</Text>
              ) : null}
            </View>
            <View className="items-end gap-1">
              <Text variant="label">
                {a.quantity} {a.commodity?.unit}
              </Text>
              <Badge variant={status.variant} label={status.label} />
            </View>
          </Card>
        );
      })}
    </View>
  );
}
