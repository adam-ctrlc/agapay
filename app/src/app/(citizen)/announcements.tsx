import { View } from "react-native";

import { useAnnouncements } from "@/lib/queries/announcements";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { AnnouncementFeed } from "@/components/announcement-feed";

export default function CitizenAnnouncements() {
  const announcements = useAnnouncements();

  return (
    <Screen
      edges={["top"]}
      refreshing={announcements.isRefetching}
      onRefresh={() => announcements.refetch()}
    >
      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Alerts
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          News and advisories from your LGU and stores.
        </Text>
      </View>

      <AnnouncementFeed />
    </Screen>
  );
}
