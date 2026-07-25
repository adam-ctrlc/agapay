import { View } from "react-native";
import { Lightning } from "phosphor-react-native";

import { useInterruptions } from "@/lib/queries/energy";
import type { InterruptionType } from "@/lib/api/energy";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Group } from "@/components/ui/list-group";
import { EmptyState } from "@/components/ui/empty-state";
import { interruptionWindow } from "@/components/energy/energy-labels";

function typeVariant(type: InterruptionType) {
  switch (type) {
    case "emergency":
    case "unplanned":
      return "destructive" as const;
    case "rotating":
      return "accent" as const;
    default:
      return "muted" as const;
  }
}

export function OutageList({
  province,
  limit = 8,
}: {
  province?: string;
  limit?: number;
}) {
  const interruptions = useInterruptions(province ? { province } : {});

  if (interruptions.isLoading) {
    return <Skeleton className="h-32 w-full rounded-3xl" />;
  }

  const items = (interruptions.data ?? []).slice(0, limit);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Lightning}
        title="No interruptions scheduled"
        description="Rotating and emergency brownouts appear here once declared."
      />
    );
  }

  return (
    <Group>
      {items.map((item, index) => (
        <View
          key={item.id}
          className={cn(
            "gap-1 px-4 py-3.5",
            index !== items.length - 1 && "border-b border-border",
          )}
        >
          <View className="flex-row items-center justify-between gap-2">
            <Text
              numberOfLines={1}
              className="flex-1 text-[15px] font-semibold text-foreground"
            >
              {item.barangay ?? item.province ?? item.utility}
            </Text>
            <Badge
              variant={item.is_active_now ? "destructive" : typeVariant(item.type)}
              label={item.is_active_now ? "ongoing" : item.type_label}
            />
          </View>
          <Text className="text-[12px] text-muted-foreground">
            {interruptionWindow(item.starts_at, item.ends_at)} · {item.utility}
            {item.households_affected
              ? ` · ${item.households_affected.toLocaleString()} households`
              : ""}
          </Text>
        </View>
      ))}
    </Group>
  );
}
