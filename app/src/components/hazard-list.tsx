import { View } from "react-native";
import { Warning } from "phosphor-react-native";

import { useHazards } from "@/lib/queries/hazards";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { Group } from "@/components/ui/list-group";
import { EmptyState } from "@/components/ui/empty-state";
import { colorForRatio } from "@/components/heatmap/severity-scale";
import { hazardLabel, hazardWhen } from "@/components/heatmap/hazard-labels";

export function HazardList({ limit = 8 }: { limit?: number }) {
  const hazards = useHazards();

  if (hazards.isLoading) {
    return <Skeleton className="h-44 w-full rounded-3xl" />;
  }

  const items = (hazards.data ?? []).slice(0, limit);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Warning}
        title="No hazards reported"
        description="Typhoons, floods, and quakes show up here as they are logged."
      />
    );
  }

  return (
    <Group>
      {items.map((hazard, index) => (
        <View
          key={hazard.id}
          className={cn(
            "flex-row items-start gap-3 px-4 py-3.5",
            index !== items.length - 1 && "border-b border-border",
          )}
        >
          <View
            className="mt-1.5 h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colorForRatio(hazard.severity / 100) }}
          />
          <View className="flex-1 gap-0.5">
            <Text className="text-[15px] font-semibold text-foreground">
              {hazardLabel(hazard.type)}
              {hazard.magnitude != null ? ` M${hazard.magnitude}` : ""}
              {" · "}
              {hazard.title}
            </Text>
            <Text className="text-[12px] text-muted-foreground">
              {hazard.place ? `${hazard.place} · ` : ""}
              {hazard.affected_people != null
                ? `${hazard.affected_people.toLocaleString()} affected · `
                : ""}
              {hazardWhen(hazard.occurred_at)}
            </Text>
          </View>
        </View>
      ))}
    </Group>
  );
}
