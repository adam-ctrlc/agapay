import { Pressable, View } from "react-native";
import { BellRinging, CalendarBlank, GasPump, Storefront, Trash } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { ClaimReminder } from "@/lib/api/claim-reminders";
import {
  useClaimReminders,
  useDeleteReminder,
} from "@/lib/queries/claim-reminders";
import { useCreateAllocation } from "@/lib/queries/allocations";
import { unitLabel } from "@/lib/units";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function dateLabel(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function ClaimRemindersList({ onClaimed }: { onClaimed?: () => void }) {
  const reminders = useClaimReminders();
  const remove = useDeleteReminder();
  const claim = useCreateAllocation();
  const dialog = useDialog();

  function onClaimNow(r: ClaimReminder) {
    if (!r.location.id || !r.commodity.id) return;
    claim.mutate(
      {
        location_id: r.location.id,
        commodity_id: r.commodity.id,
        quantity: r.quantity,
      },
      {
        onSuccess: () => {
          remove.mutate(r.id);
          onClaimed?.();
          dialog.alert({
            title: "Reserved for you!",
            message: "Show the code or QR in the Vouchers tab at the store.",
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not reserve",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  if (reminders.isLoading) {
    return (
      <View className="gap-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </View>
    );
  }

  if (reminders.isError) {
    return (
      <Text className="text-destructive">
        Couldn&apos;t load your saved plans.
      </Text>
    );
  }

  const items = reminders.data ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BellRinging}
        title="No saved plans"
        description="On an available item, tap Remind me and it gets saved here so you do not miss the claiming window."
      />
    );
  }

  return (
    <View className="gap-3">
      {items.map((r) => {
        const isStore = r.location.type === "kadiwa_store";
        const accent = isStore ? PH_COLORS.blue : PH_COLORS.red;
        const tint = isStore ? "#0038a814" : "#ce112614";
        const claimingThis =
          claim.isPending &&
          claim.variables?.location_id === r.location.id &&
          claim.variables?.commodity_id === r.commodity.id;

        return (
          <Card key={r.id} className="gap-3">
            <View className="flex-row items-center gap-3">
              <View
                className="h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: tint }}
              >
                {isStore ? (
                  <Storefront size={22} color={accent} weight="duotone" />
                ) : (
                  <GasPump size={22} color={accent} weight="duotone" />
                )}
              </View>
              <View className="flex-1">
                <Text variant="label" className="text-base">
                  {r.commodity.name}
                </Text>
                <Text variant="caption">
                  {r.location.name}
                  {r.location.barangay ? ` · ${r.location.barangay}` : ""}
                </Text>
              </View>
              <Pressable
                onPress={() => remove.mutate(r.id)}
                hitSlop={8}
                className="active:opacity-60"
              >
                <Trash size={20} color={PH_COLORS.red} />
              </Pressable>
            </View>

            <View className="flex-row items-center gap-2">
              <CalendarBlank size={16} color={PH_COLORS.mutedForeground} />
              <Text variant="caption">
                Plan to claim {r.quantity} {unitLabel(r.commodity.unit)} on{" "}
                {dateLabel(r.remind_on)}
              </Text>
            </View>

            <Button
              variant="success"
              label={`Claim ${r.quantity} ${unitLabel(r.commodity.unit)} now`}
              loading={claimingThis}
              onPress={() => onClaimNow(r)}
            />
          </Card>
        );
      })}
    </View>
  );
}
