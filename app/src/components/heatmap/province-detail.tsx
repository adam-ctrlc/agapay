import { Pressable, View } from "react-native";
import { CloudRain, Warning, X } from "phosphor-react-native";

import type { ProvinceWeather } from "@/lib/api/weather";
import { useProvinceDetail } from "@/lib/queries/heatmap";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/dashboard/stat-tile";
import { colorForRatio } from "@/components/heatmap/severity-scale";
import { hazardLabel, hazardWhen } from "@/components/heatmap/hazard-labels";

export function ProvinceDetail({
  code,
  weather,
  onClose,
}: {
  code: string;
  weather?: ProvinceWeather | null;
  onClose: () => void;
}) {
  const detail = useProvinceDetail(code);
  const data = detail.data;
  const events = data?.events.slice(0, 6) ?? [];

  return (
    <View className="gap-3 rounded-[28px] border border-primary bg-card p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-[19px] font-bold leading-tight text-foreground">
          {data?.name ?? code}
        </Text>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={null}
          className="h-7 w-7 items-center justify-center rounded-full bg-muted active:opacity-60"
        >
          <X size={15} color={PH_COLORS.mutedForeground} weight="bold" />
        </Pressable>
      </View>

      {detail.isLoading ? (
        <Skeleton className="h-20 w-full rounded-3xl" />
      ) : data ? (
        <>
          <View className="flex-row gap-3">
            <StatTile
              value={data.affected_people.toLocaleString()}
              label="Affected"
              tint="#e8effb"
            />
            <StatTile
              value={`${data.severity}/100`}
              label="Severity"
              tint="#fce8ea"
            />
            <StatTile
              value={String(data.event_count)}
              label="Events"
              tint="#f1f3f6"
            />
          </View>

          {weather ? (
            <View
              className="flex-row items-center gap-2 rounded-2xl px-3.5 py-3"
              style={{ backgroundColor: "#e8effb" }}
            >
              <CloudRain size={17} color={PH_COLORS.blue} weight="duotone" />
              <Text className="flex-1 text-[12px] text-foreground">
                {weather.description ?? "Weather"}
                {weather.temperature != null
                  ? ` · ${Math.round(weather.temperature)}°C`
                  : ""}
                {weather.precipitation > 0
                  ? ` · ${weather.precipitation}mm rain`
                  : ""}
                {weather.wind_speed != null
                  ? ` · ${Math.round(weather.wind_speed)} km/h wind`
                  : ""}
              </Text>
            </View>
          ) : null}

          {events.length === 0 ? (
            <EmptyState
              icon={Warning}
              title="No recorded hazards"
              description="Nothing has been logged for this province in the selected window."
              compact
            />
          ) : (
            <View className="overflow-hidden rounded-2xl bg-muted">
              {events.map((event, index) => (
                <View
                  key={event.id}
                  className={cn(
                    "flex-row items-start gap-2.5 px-3.5 py-3",
                    index !== events.length - 1 && "border-b border-border",
                  )}
                >
                  <View
                    className="mt-1.5 h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: colorForRatio(event.severity / 100),
                    }}
                  />
                  <View className="flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[14px] font-semibold text-foreground"
                    >
                      {hazardLabel(event.type)}
                      {event.magnitude != null ? ` M${event.magnitude}` : ""}
                      {" · "}
                      {event.title}
                    </Text>
                    <Text className="text-[12px] text-muted-foreground">
                      {event.affected_people != null
                        ? `${event.affected_people.toLocaleString()} affected · `
                        : ""}
                      {hazardWhen(event.occurred_at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text className="text-[13px] font-semibold text-destructive">
          Couldn&apos;t load this province.
        </Text>
      )}
    </View>
  );
}
