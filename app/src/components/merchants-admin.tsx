import { useMemo, useState } from "react";
import { View } from "react-native";
import { Storefront, Tray } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { MerchantAccount, MerchantFilter } from "@/lib/api/merchants";
import {
  useApproveMerchant,
  useMerchants,
  useRevokeMerchant,
} from "@/lib/queries/merchants";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDialog } from "@/components/ui/dialog";
import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";

const FILTERS: { key: MerchantFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "all", label: "All" },
];

function MerchantRow({ merchant }: { merchant: MerchantAccount }) {
  const approve = useApproveMerchant();
  const revoke = useRevokeMerchant();
  const dialog = useDialog();

  const pending = !merchant.is_approved;

  function onError(e: unknown) {
    dialog.alert({
      title: "Could not update",
      message: e instanceof ApiError ? e.message : "Please try again.",
    });
  }

  async function onRevoke() {
    const ok = await dialog.confirm({
      title: "Pause this store?",
      message: `${merchant.name} will not be able to redeem vouchers until approved again.`,
      confirmLabel: "Pause",
      destructive: true,
    });

    if (ok) revoke.mutate(merchant.id, { onError });
  }

  return (
    <View className="gap-3 rounded-[28px] border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: pending ? "#fdf1cf" : "#e1f3ec" }}
        >
          <Storefront
            size={20}
            color={pending ? "#8a6800" : PH_COLORS.success}
            weight="duotone"
          />
        </View>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-[15px] font-bold leading-tight text-foreground"
          >
            {merchant.name}
          </Text>
          <Text numberOfLines={1} className="text-[12px] text-muted-foreground">
            {merchant.email}
          </Text>
        </View>
        <Badge
          variant={pending ? "accent" : "success"}
          label={pending ? "Pending" : "Approved"}
        />
      </View>

      <View className="gap-0.5 rounded-2xl border border-border p-3">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Assigned store
        </Text>
        <Text className="text-[13px] font-semibold text-foreground">
          {merchant.location?.name ?? "No store assigned"}
        </Text>
        {merchant.phone ? (
          <Text className="text-[12px] text-muted-foreground">
            {merchant.phone}
          </Text>
        ) : null}
      </View>

      {pending ? (
        <Button
          size="sm"
          label="Approve store"
          loading={approve.isPending}
          disabled={merchant.location == null}
          onPress={() => approve.mutate(merchant.id, { onError })}
        />
      ) : (
        <Button
          size="sm"
          variant="outline"
          label="Pause store"
          loading={revoke.isPending}
          onPress={onRevoke}
        />
      )}

      {pending && merchant.location == null ? (
        <Text className="text-[11px] text-muted-foreground">
          Assign a store to this account before approving it.
        </Text>
      ) : null}
    </View>
  );
}

export function MerchantsAdmin() {
  const [filter, setFilter] = useState<MerchantFilter>("pending");
  const merchants = useMerchants(filter);

  const items = useMemo(() => merchants.data ?? [], [merchants.data]);

  const options = useMemo<SegmentedOption<MerchantFilter>[]>(
    () => FILTERS.map((f) => ({ key: f.key, label: f.label })),
    [],
  );

  return (
    <>
      <Text className="text-[13px] leading-[19px] text-muted-foreground">
        A new merchant can sign in straight away but cannot redeem anything
        until you approve their store.
      </Text>

      <ChipRow
        value={filter}
        onChange={(next) => setFilter(next)}
        options={options}
      />

      <SectionLabel>
        {items.length === 1 ? "1 merchant" : `${items.length} merchants`}
      </SectionLabel>

      {merchants.isLoading ? (
        <View className="gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-[28px]" />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon={filter === "pending" ? Storefront : Tray}
          title={
            filter === "pending" ? "No stores waiting" : "Nothing in this tab"
          }
          description={
            filter === "pending"
              ? "New merchant sign-ups land here for you to approve."
              : "No merchant accounts match this tab right now."
          }
          tint={filter === "pending" ? "#e8effb" : PH_COLORS.white}
          color={
            filter === "pending" ? PH_COLORS.blue : PH_COLORS.mutedForeground
          }
        />
      ) : (
        <View className="gap-3">
          {items.map((merchant) => (
            <MerchantRow key={merchant.id} merchant={merchant} />
          ))}
        </View>
      )}
    </>
  );
}
