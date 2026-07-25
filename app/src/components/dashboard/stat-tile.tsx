import { View } from "react-native";

import { Text } from "@/components/ui/text";

export function StatTile({
  value,
  label,
  tint = "#eef2f7",
  color,
}: {
  value: string;
  label: string;
  tint?: string;
  color?: string;
}) {
  return (
    <View
      className="flex-1 gap-0.5 rounded-3xl px-3 py-3.5"
      style={{ backgroundColor: tint }}
    >
      <Text
        numberOfLines={1}
        className="text-[22px] font-bold leading-tight text-foreground"
        style={color ? { color } : undefined}
      >
        {value}
      </Text>
      <Text numberOfLines={1} className="text-[11px] font-medium text-muted-foreground">
        {label}
      </Text>
    </View>
  );
}
