import { Pressable, View } from "react-native";
import {
  Bell,
  ChatCircle,
  Heart,
  Warning,
} from "phosphor-react-native";

import type { AppNotification } from "@/lib/api/notifications";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/queries/notifications";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BackBar } from "@/components/back-bar";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "like":
      return <Heart size={20} color={PH_COLORS.red} weight="fill" />;
    case "reply":
      return <ChatCircle size={20} color={PH_COLORS.blue} weight="duotone" />;
    case "advisory":
      return <Warning size={20} color={PH_COLORS.red} weight="duotone" />;
    default:
      return <Bell size={20} color={PH_COLORS.mutedForeground} />;
  }
}

export default function NotificationsScreen() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.data ?? [];
  const hasUnread = items.some((n) => !n.read);

  function onPress(item: AppNotification) {
    if (!item.read) markRead.mutate(item.id);
  }

  return (
    <Screen
      edges={["top"]}
      refreshing={notifications.isRefetching}
      onRefresh={() => notifications.refetch()}
    >
      <BackBar />

      <View className="flex-row items-center justify-between">
        <Text variant="title">Notifications</Text>
        {hasUnread ? (
          <Pressable
            onPress={() => markAll.mutate()}
            hitSlop={8}
            className="active:opacity-60"
          >
            <Text variant="caption" className="font-medium text-primary">
              Mark all read
            </Text>
          </Pressable>
        ) : null}
      </View>

      {notifications.isLoading ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </View>
      ) : notifications.isError ? (
        <Text className="text-destructive">
          Couldn&apos;t load your notifications.
        </Text>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Updates on your claims, reports, and LGU alerts land here."
        />
      ) : (
        <View className="gap-3">
          {items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onPress(item)}
              className="active:opacity-80"
            >
              <Card
                className={
                  item.read
                    ? "flex-row items-start gap-3"
                    : "flex-row items-start gap-3 border-accent bg-secondary"
                }
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                  <NotificationIcon type={item.type} />
                </View>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text variant="label">{item.title}</Text>
                    <Text variant="caption">{timeAgo(item.created_at)}</Text>
                  </View>
                  <Text variant="caption">{item.body}</Text>
                </View>
                {!item.read ? (
                  <View
                    className="mt-1 h-2 w-2 rounded-full"
                    style={{ backgroundColor: PH_COLORS.blue }}
                  />
                ) : null}
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
