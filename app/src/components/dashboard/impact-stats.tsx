import { View } from "react-native";
import { MapPin, Pulse, Users } from "phosphor-react-native";

import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = {
  tint: string;
  chip: string;
  color: string;
};

const TONES: Record<"affected" | "events" | "provinces", Tone> = {
  affected: { tint: "#fce8ea", chip: "#f7d1d6", color: PH_COLORS.red },
  events: { tint: "#fdf1cf", chip: "#f6e3ab", color: "#8a6800" },
  provinces: { tint: "#e8effb", chip: "#d4e0f7", color: PH_COLORS.blue },
};

function Tile({
  tone,
  icon,
  value,
  label,
}: {
  tone: Tone;
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View
      className="flex-1 justify-between gap-3 rounded-3xl p-3.5"
      style={{ backgroundColor: tone.tint }}
    >
      <View
        className="h-8 w-8 items-center justify-center rounded-2xl"
        style={{ backgroundColor: tone.chip }}
      >
        {icon}
      </View>

      <View className="gap-0.5">
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="text-[24px] font-bold leading-tight"
          style={{ color: tone.color }}
        >
          {value}
        </Text>
        <Text className="text-[11px] font-medium leading-tight text-muted-foreground">
          {label}
        </Text>
      </View>
    </View>
  );
}

export function ImpactStats({
  affected,
  events,
  provinces,
  loading = false,
}: {
  affected: string;
  events: string;
  provinces: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <View className="flex-row gap-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[118px] flex-1 rounded-3xl" />
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row gap-2.5">
      <Tile
        tone={TONES.affected}
        icon={<Users size={17} color={TONES.affected.color} weight="fill" />}
        value={affected}
        label="People affected"
      />
      <Tile
        tone={TONES.events}
        icon={<Pulse size={17} color={TONES.events.color} weight="bold" />}
        value={events}
        label="Active events"
      />
      <Tile
        tone={TONES.provinces}
        icon={<MapPin size={17} color={TONES.provinces.color} weight="fill" />}
        value={provinces}
        label="Provinces hit"
      />
    </View>
  );
}
