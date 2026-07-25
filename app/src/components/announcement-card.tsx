import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChatCircle, Heart } from "phosphor-react-native";

import type {
  Announcement,
  AnnouncementCategory,
} from "@/lib/api/announcements";
import { useToggleLike } from "@/lib/queries/announcements";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { CommentsSection } from "@/components/announcement-comments";

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

function roleLabel(role: string | null | undefined) {
  switch (role) {
    case "lgu_admin":
      return "City DRRMO";
    case "merchant":
      return "Merchant";
    default:
      return "";
  }
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      className="flex-row items-center gap-1.5 active:opacity-60"
    >
      {icon}
      <Text variant="caption">{label}</Text>
    </Pressable>
  );
}

export function AnnouncementCard({
  announcement,
  onDelete,
}: {
  announcement: Announcement;
  onDelete?: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const like = useToggleLike();
  const cat = CATEGORY[announcement.category];
  const source = roleLabel(announcement.author?.role);

  return (
    <View className="gap-2 rounded-3xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-2">
        <Badge variant={cat.variant} label={cat.label} />
        <Text className="flex-1 text-[11px] font-medium text-muted-foreground">
          {timeAgo(announcement.created_at)}
        </Text>
        {onDelete ? (
          <Pressable onPress={onDelete} hitSlop={8}>
            <Text variant="caption" className="font-medium text-destructive">
              Remove
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="text-[17px] font-bold leading-snug text-foreground">
        {announcement.title}
      </Text>
      <Text className="text-sm leading-5 text-foreground">
        {announcement.body}
      </Text>
      <Text className="text-xs text-muted-foreground">
        {[announcement.author?.name, source].filter(Boolean).join(" · ")}
      </Text>

      <View className="mt-1 flex-row items-center gap-6 border-t border-border pt-2.5">
        <Action
          onPress={() => like.mutate(announcement.id)}
          icon={
            <Heart
              size={20}
              weight={announcement.liked ? "fill" : "regular"}
              color={
                announcement.liked ? PH_COLORS.red : PH_COLORS.mutedForeground
              }
            />
          }
          label={String(announcement.likes_count ?? 0)}
        />
        <Action
          onPress={() => setShowComments((v) => !v)}
          icon={<ChatCircle size={20} color={PH_COLORS.mutedForeground} />}
          label={String(announcement.comments_count ?? 0)}
        />
      </View>

      {showComments ? (
        <CommentsSection announcementId={announcement.id} />
      ) : null}
    </View>
  );
}
