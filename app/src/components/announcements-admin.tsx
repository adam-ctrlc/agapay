import { useState } from "react";
import { TextInput, View } from "react-native";

import { ApiError } from "@/lib/api/client";
import type { AnnouncementCategory } from "@/lib/api/announcements";
import {
  useAnnouncements,
  useCreateAnnouncement,
} from "@/lib/queries/announcements";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog";
import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";
import { AnnouncementFeed } from "@/components/announcement-feed";

const CATEGORIES: SegmentedOption<AnnouncementCategory>[] = [
  { key: "general", label: "News" },
  { key: "relief", label: "Relief" },
  { key: "advisory", label: "Advisory" },
  { key: "price", label: "Prices" },
];

export function AnnouncementsAdmin() {
  const announcements = useAnnouncements();
  const create = useCreateAnnouncement();
  const dialog = useDialog();

  const [category, setCategory] = useState<AnnouncementCategory>("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function post() {
    if (!title.trim() || !body.trim()) {
      dialog.alert("Add a title and a message first.");
      return;
    }
    create.mutate(
      { title: title.trim(), body: body.trim(), category },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
          setCategory("general");
          dialog.alert({
            title: "Posted",
            message: "Citizens can now see your announcement.",
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not post",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  return (
    <Screen
      refreshing={announcements.isRefetching}
      onRefresh={() => announcements.refetch()}
    >
      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Alerts
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Post updates for citizens to see.
        </Text>
      </View>

      <SectionLabel>New announcement</SectionLabel>
      <View className="rounded-3xl border border-border bg-card p-4">
        <View className="gap-3">
          <ChipRow
            value={category}
            onChange={(next) => setCategory(next)}
            options={CATEGORIES}
          />
          <Field label="Title">
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Kadiwa pop-up this Saturday"
            />
          </Field>
          <Field label="Message">
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              placeholder="Write the details citizens should know..."
              placeholderTextColor={PH_COLORS.mutedForeground}
              className="min-h-[104px] rounded-2xl border border-input bg-background p-3 text-base text-foreground"
            />
          </Field>
          <Button
            label="Post announcement"
            loading={create.isPending}
            disabled={!title.trim() || !body.trim()}
            onPress={post}
          />
        </View>
      </View>

      <SectionLabel>Posted</SectionLabel>
      <AnnouncementFeed manage />
    </Screen>
  );
}
