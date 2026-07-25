import { View } from "react-native";
import type { IconProps } from "phosphor-react-native";

import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";

/**
 * One shape for every "there is nothing to show" case, so an empty filter and
 * an empty list never look like two different kinds of problem.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  tint = "#e8effb",
  color = PH_COLORS.blue,
  action,
  compact = false,
}: {
  icon: React.ComponentType<IconProps>;
  title: string;
  description?: string;
  tint?: string;
  color?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const size = compact ? 64 : 88;

  /**
   * Spacing is explicit rather than gap plus margins. The circle carries most
   * of the visual weight, so an uneven top and bottom is obvious here in a way
   * it is not on a normal card.
   */
  return (
    <View
      className="items-center rounded-[28px] bg-muted"
      style={{
        paddingHorizontal: compact ? 20 : 24,
        paddingVertical: compact ? 28 : 40,
      }}
    >
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          marginBottom: compact ? 12 : 16,
          backgroundColor: tint,
        }}
      >
        <Icon size={compact ? 30 : 42} color={color} weight="duotone" />
      </View>

      <Text
        className={cn(
          "text-center font-bold text-foreground",
          compact ? "text-[14px]" : "text-[16px]",
        )}
      >
        {title}
      </Text>

      {description ? (
        <Text
          style={{ marginTop: 4 }}
          className="max-w-[290px] text-center text-[13px] leading-[19px] text-muted-foreground"
        >
          {description}
        </Text>
      ) : null}

      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}
