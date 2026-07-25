import { useMemo, useState } from "react";
import { View } from "react-native";
import { MagnifyingGlass, Megaphone } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { AnnouncementCategory } from "@/lib/api/announcements";
import {
  useAnnouncements,
  useDeleteAnnouncement,
} from "@/lib/queries/announcements";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { useDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { IconInput } from "@/components/ui/icon-input";
import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import { AnnouncementCard } from "@/components/announcement-card";

type FeedCategory = AnnouncementCategory | "all";

const CATEGORIES: SegmentedOption<FeedCategory>[] = [
  { key: "all", label: "All" },
  { key: "relief", label: "Relief" },
  { key: "advisory", label: "Advisory" },
  { key: "price", label: "Prices" },
  { key: "general", label: "News" },
];

export function AnnouncementFeed({ manage }: { manage?: boolean }) {
  const announcements = useAnnouncements();
  const del = useDeleteAnnouncement();
  const dialog = useDialog();
  const [category, setCategory] = useState<FeedCategory>("all");
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    let data = announcements.data ?? [];
    if (category !== "all") {
      data = data.filter((a) => a.category === category);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      data = data.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.body.toLowerCase().includes(term),
      );
    }
    return data;
  }, [announcements.data, category, search]);

  async function confirmDelete(id: number) {
    const ok = await dialog.confirm({
      title: "Remove announcement?",
      message: "This cannot be undone.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    del.mutate(id, {
      onError: (e) =>
        dialog.alert({
          title: "Could not remove",
          message: e instanceof ApiError ? e.message : "Please try again.",
        }),
    });
  }

  return (
    <View className="gap-3">
      <IconInput
        icon={<MagnifyingGlass size={20} color={PH_COLORS.mutedForeground} />}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Search announcements"
      />

      <ChipRow
        value={category}
        onChange={(next) => setCategory(next)}
        options={CATEGORIES}
      />

      {announcements.isLoading ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </View>
      ) : announcements.isError ? (
        <Text className="text-destructive">
          Couldn&apos;t load announcements.
        </Text>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nothing here"
          description="No announcement matches your search. Try another word or clear the filter."
          tint={PH_COLORS.white}
          color={PH_COLORS.mutedForeground}
        />
      ) : (
        items.map((a) => (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            onDelete={manage ? () => confirmDelete(a.id) : undefined}
          />
        ))
      )}
    </View>
  );
}
