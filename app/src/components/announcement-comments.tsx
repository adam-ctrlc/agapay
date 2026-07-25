import { useState } from "react";
import { ChatCircleDots } from "phosphor-react-native";
import { Pressable, View } from "react-native";

import { ApiError } from "@/lib/api/client";
import type { AnnouncementComment } from "@/lib/api/announcements";
import { useAddComment, useComments } from "@/lib/queries/announcements";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { useDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: AnnouncementComment;
  onReply?: () => void;
}) {
  return (
    <View className="gap-0.5">
      <View className="flex-row items-center gap-2">
        <Text variant="label">{comment.author?.name ?? "User"}</Text>
        <Text variant="caption">{timeAgo(comment.created_at)}</Text>
      </View>
      <Text className="text-sm text-foreground">{comment.body}</Text>
      {onReply ? (
        <Pressable onPress={onReply} hitSlop={6} className="self-start">
          <Text variant="caption" className="font-medium text-primary">
            Reply
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function CommentsSection({ announcementId }: { announcementId: number }) {
  const comments = useComments(announcementId, true);
  const add = useAddComment(announcementId);
  const dialog = useDialog();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  function onError(e: unknown) {
    dialog.alert({
      title: "Could not comment",
      message: e instanceof ApiError ? e.message : "Please try again.",
    });
  }

  function submitTop() {
    const body = text.trim();
    if (!body) return;
    add.mutate({ body }, { onSuccess: () => setText(""), onError });
  }

  function submitReply(parentId: number) {
    const body = replyText.trim();
    if (!body) return;
    add.mutate(
      { body, parentId },
      {
        onSuccess: () => {
          setReplyText("");
          setReplyTo(null);
        },
        onError,
      },
    );
  }

  return (
    <View className="gap-3 border-t border-border pt-3">
      {comments.isLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : (comments.data ?? []).length === 0 ? (
        <EmptyState
          icon={ChatCircleDots}
          title="No comments yet"
          description="Be the first to say something."
          compact
        />
      ) : (
        comments.data?.map((c) => (
          <View key={c.id} className="gap-2">
            <CommentItem
              comment={c}
              onReply={() => setReplyTo(replyTo === c.id ? null : c.id)}
            />

            {(c.replies ?? []).length > 0 ? (
              <View className="ml-4 gap-2 border-l border-border pl-3">
                {c.replies?.map((r) => (
                  <CommentItem key={r.id} comment={r} />
                ))}
              </View>
            ) : null}

            {replyTo === c.id ? (
              <View className="ml-4 flex-row items-center gap-2">
                <Input
                  className="flex-1"
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder={`Reply to ${c.author?.name ?? "user"}...`}
                />
                <Button
                  size="sm"
                  label="Reply"
                  disabled={!replyText.trim()}
                  loading={add.isPending}
                  onPress={() => submitReply(c.id)}
                />
              </View>
            ) : null}
          </View>
        ))
      )}

      <View className="flex-row items-center gap-2">
        <Input
          className="flex-1"
          value={text}
          onChangeText={setText}
          placeholder="Write a comment..."
        />
        <Button
          size="sm"
          label="Send"
          disabled={!text.trim()}
          loading={add.isPending}
          onPress={submitTop}
        />
      </View>
    </View>
  );
}
