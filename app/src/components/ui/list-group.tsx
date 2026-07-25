import { Pressable, View } from "react-native";
import { CaretRight } from "phosphor-react-native";

import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export function SectionLabel({
  children,
  action,
}: {
  children: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between px-1 pt-1">
      <Text className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {children}
      </Text>
      {action}
    </View>
  );
}

export function Group({ children }: { children: React.ReactNode }) {
  return (
    <View className="overflow-hidden rounded-3xl border border-border bg-card">
      {children}
    </View>
  );
}

export function Row({
  icon,
  label,
  value,
  last = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  const empty = value === "Not set" || value === "Not linked";

  return (
    <View
      className={cn(
        "flex-row items-center gap-3 px-4 py-3.5",
        !last && "border-b border-border",
      )}
    >
      {icon}
      <Text className="flex-1 text-[13px] text-muted-foreground">{label}</Text>
      <Text
        numberOfLines={1}
        className={cn(
          "max-w-[55%] text-right text-[14px] font-semibold",
          empty ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </Text>
    </View>
  );
}

export function ActionRow({
  icon,
  label,
  hint,
  badge,
  onPress,
  destructive = false,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  badge?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={null}
      className={cn(
        "flex-row items-center gap-3 px-4 py-4 active:opacity-60",
        !last && "border-b border-border",
      )}
    >
      {icon}
      <View className="flex-1">
        <Text
          className={cn(
            "text-[15px] font-semibold",
            destructive ? "text-destructive" : "text-foreground",
          )}
        >
          {label}
        </Text>
        {hint ? (
          <Text className="text-xs text-muted-foreground">{hint}</Text>
        ) : null}
      </View>
      {badge ?? <CaretRight size={16} color={PH_COLORS.mutedForeground} />}
    </Pressable>
  );
}
