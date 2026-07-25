import { Pressable, View } from "react-native";
import { Link } from "expo-router";
import { Bell } from "phosphor-react-native";

import { useUnreadCount } from "@/lib/queries/notifications";
import { PH_COLORS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

export function NotificationBell({
  color = PH_COLORS.foreground,
  onSurface = false,
}: {
  color?: string;
  onSurface?: boolean;
}) {
  const unread = useUnreadCount();

  return (
    <Link href="/notifications" asChild>
      <Pressable hitSlop={8} className="active:opacity-60">
        <View
          className={cn(
            onSurface &&
              "h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/15",
          )}
        >
          <Bell size={onSurface ? 22 : 26} color={color} weight="regular" />
          {unread > 0 ? (
            <View
              className={cn(
                "absolute h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1",
                onSurface ? "right-0 top-0" : "-right-1.5 -top-1.5",
              )}
            >
              <Text className="text-[10px] font-bold text-destructive-foreground">
                {unread > 9 ? "9+" : unread}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}
