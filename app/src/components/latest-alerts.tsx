import { Pressable, View } from "react-native";
import { Link } from "expo-router";

import type {
  Announcement,
  AnnouncementCategory,
} from "@/lib/api/announcements";
import { useAnnouncements } from "@/lib/queries/announcements";
import { useAuth } from "@/lib/auth/context";
import { announcementsHref } from "@/lib/auth/role-routes";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionLabel } from "@/components/ui/list-group";

type BadgeVariant = "success" | "destructive" | "accent" | "secondary";

const CATEGORY: Record<
  AnnouncementCategory,
  { label: string; variant: BadgeVariant }
> = {
  relief: { label: "Relief", variant: "success" },
  advisory: { label: "Advisory", variant: "destructive" },
  price: { label: "Prices", variant: "accent" },
  general: { label: "News", variant: "secondary" },
};

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AlertRow({ item, last }: { item: Announcement; last: boolean }) {
  const cat = CATEGORY[item.category];

  return (
    <View className={cn("gap-1.5 px-4 py-3.5", !last && "border-b border-border")}>
      <View className="flex-row items-center justify-between gap-2">
        <Badge variant={cat.variant} label={cat.label} />
        <Text className="text-[11px] text-muted-foreground">
          {timeAgo(item.created_at)}
        </Text>
      </View>
      <Text
        numberOfLines={1}
        className="text-[15px] font-semibold text-foreground"
      >
        {item.title}
      </Text>
      <Text numberOfLines={2} className="text-[13px] text-muted-foreground">
        {item.body}
      </Text>
    </View>
  );
}

export function LatestAlerts() {
  const { user } = useAuth();
  const query = useAnnouncements();
  const items = (query.data ?? []).slice(0, 2);
  const href = announcementsHref(user?.role);

  if (!query.isLoading && items.length === 0) return null;

  return (
    <>
      <SectionLabel
        action={
          <Link href={href} asChild>
            <Pressable hitSlop={8} className="active:opacity-60">
              <Text className="text-[13px] font-semibold text-primary">
                See all
              </Text>
            </Pressable>
          </Link>
        }
      >
        Latest alerts
      </SectionLabel>

      {query.isLoading ? (
        <Skeleton className="h-40 w-full rounded-3xl" />
      ) : (
        <Link href={href} asChild>
          <Pressable className="overflow-hidden rounded-3xl border border-border bg-card active:opacity-90">
            {items.map((item, index) => (
              <AlertRow
                key={item.id}
                item={item}
                last={index === items.length - 1}
              />
            ))}
          </Pressable>
        </Link>
      )}
    </>
  );
}
