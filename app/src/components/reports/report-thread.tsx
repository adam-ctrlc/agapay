import { useState } from "react";
import { Pressable, View } from "react-native";
import { ChatCircleDots, PaperPlaneRight, Trash } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { ReportComment } from "@/lib/api/report-comments";
import {
  useDeleteReportComment,
  useReportComments,
  useSendReportComment,
} from "@/lib/queries/report-comments";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDialog } from "@/components/ui/dialog";
import { hazardWhen } from "@/components/heatmap/hazard-labels";

function Bubble({
  comment,
  onRemove,
}: {
  comment: ReportComment;
  onRemove: () => void;
}) {
  const mine = comment.is_mine;

  return (
    <View className={cn("max-w-[85%] gap-1", mine ? "self-end" : "self-start")}>
      <View className="flex-row items-center gap-1.5 px-1">
        <Text className="text-[11px] font-bold text-foreground">
          {mine ? "You" : comment.author.name}
        </Text>
        {comment.is_official && !mine ? (
          <View className="rounded-full bg-primary px-1.5 py-0.5">
            <Text className="text-[9px] font-bold text-primary-foreground">
              LGU
            </Text>
          </View>
        ) : null}
        {comment.created_at ? (
          <Text className="text-[10px] text-muted-foreground">
            {hazardWhen(comment.created_at)}
          </Text>
        ) : null}
      </View>

      <Pressable
        onLongPress={mine ? onRemove : undefined}
        android_ripple={null}
        className={cn(
          "rounded-2xl px-3.5 py-2.5",
          mine ? "bg-primary" : "bg-muted",
        )}
      >
        <Text
          className={cn(
            "text-[13px] leading-[19px]",
            mine ? "text-primary-foreground" : "text-foreground",
          )}
        >
          {comment.body}
        </Text>
      </Pressable>
    </View>
  );
}

export function ReportThread({
  reportId,
  count,
}: {
  reportId: number;
  count: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const comments = useReportComments(reportId, open);
  const send = useSendReportComment(reportId);
  const remove = useDeleteReportComment(reportId);
  const dialog = useDialog();

  const items = comments.data ?? [];

  function submit() {
    const body = draft.trim();
    if (!body) return;

    send.mutate(body, {
      onSuccess: () => setDraft(""),
      onError: (e) =>
        dialog.alert({
          title: "Could not send",
          message: e instanceof ApiError ? e.message : "Please try again.",
        }),
    });
  }

  async function confirmRemove(id: number) {
    const ok = await dialog.confirm({
      title: "Remove this message?",
      message: "It disappears for both sides.",
      confirmLabel: "Remove",
      destructive: true,
    });

    if (ok) remove.mutate(id);
  }

  return (
    <View className="gap-3 rounded-2xl border border-border p-3">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        android_ripple={null}
        className="flex-row items-center gap-2 active:opacity-70"
      >
        <ChatCircleDots size={17} color={PH_COLORS.blue} weight="duotone" />
        <Text className="flex-1 text-[13px] font-bold text-foreground">
          Messages{count > 0 ? ` (${count})` : ""}
        </Text>
        <Text className="text-[12px] font-semibold text-primary">
          {open ? "Hide" : "Open"}
        </Text>
      </Pressable>

      {open ? (
        <>
          {comments.isLoading ? (
            <Skeleton className="h-16 w-full rounded-2xl" />
          ) : items.length === 0 ? (
            <EmptyState
              icon={ChatCircleDots}
              title="No messages yet"
              description="Ask a question, or add anything you left out of the report."
              compact
            />
          ) : (
            <View className="gap-3">
              {items.map((comment) => (
                <Bubble
                  key={comment.id}
                  comment={comment}
                  onRemove={() => confirmRemove(comment.id)}
                />
              ))}
            </View>
          )}

          <View className="flex-row items-end gap-2">
            <Input
              className="flex-1"
              value={draft}
              onChangeText={setDraft}
              multiline
              placeholder="Write a message"
            />
            <Pressable
              onPress={submit}
              disabled={!draft.trim() || send.isPending}
              android_ripple={null}
              className={cn(
                "h-12 w-12 items-center justify-center rounded-2xl",
                draft.trim() && !send.isPending
                  ? "bg-primary active:opacity-80"
                  : "border border-border bg-muted",
              )}
            >
              <PaperPlaneRight
                size={18}
                weight="fill"
                color={
                  draft.trim() && !send.isPending
                    ? PH_COLORS.white
                    : PH_COLORS.mutedForeground
                }
              />
            </Pressable>
          </View>

          {items.some((c) => c.is_mine) ? (
            <View className="flex-row items-center gap-1.5">
              <Trash size={11} color={PH_COLORS.mutedForeground} />
              <Text className="text-[10px] text-muted-foreground">
                Long press your own message to remove it.
              </Text>
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
