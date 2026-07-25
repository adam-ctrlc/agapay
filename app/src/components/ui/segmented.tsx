import { Pressable, ScrollView, View } from "react-native";

import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

export type SegmentedOption<T extends string> = {
  key: T;
  label: string;
  icon?: (active: boolean) => React.ReactNode;
};

/**
 * Track-and-raised-segment control. Reads as one object rather than a row of
 * separate bordered buttons.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
}) {
  return (
    <View className="flex-row rounded-[20px] bg-muted p-1.5">
      {options.map((option) => {
        const active = option.key === value;

        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            android_ripple={null}
            className={cn(
              "flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3 active:opacity-80",
              active && "bg-primary",
            )}
          >
            {option.icon?.(active)}
            <Text
              numberOfLines={1}
              className={cn(
                "text-[13px] font-bold",
                active ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Horizontally scrolling pills. Suits more options than a segmented control
 * can hold without cramping the labels.
 */
export function ChipRow<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
    >
      {options.map((option) => {
        const active = option.key === value;

        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            android_ripple={null}
            className={cn(
              "rounded-full px-4 py-2 active:opacity-70",
              active ? "bg-primary" : "bg-muted",
            )}
          >
            <Text
              className={cn(
                "text-[13px] font-semibold",
                active ? "text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
