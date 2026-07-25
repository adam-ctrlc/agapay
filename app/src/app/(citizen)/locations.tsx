import { useState } from "react";
import { Pressable, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Basket, GasPump, Minus, Plus, Storefront, Tag } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { Inventory, Location } from "@/lib/api/locations";
import { useLocations } from "@/lib/queries/locations";
import { useEligibility } from "@/lib/queries/eligibility";
import { useCreateAllocation } from "@/lib/queries/allocations";
import { useCreateReminder } from "@/lib/queries/claim-reminders";
import { scheduleClaimReminder } from "@/lib/notifications";
import { cn } from "@/lib/utils";
import { unitLabel } from "@/lib/units";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { useDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChipRow,
  Segmented,
  type SegmentedOption,
} from "@/components/ui/segmented";
import { ClaimHistory } from "@/components/claim-history";
import { MyVouchers } from "@/components/my-vouchers";
import { ClaimRemindersList } from "@/components/claim-reminders-list";
import { LeafletMap } from "@/components/leaflet-map";
import { PriceList } from "@/components/price-list";
import { GridAlertBanner } from "@/components/energy/grid-alert-banner";
import {
  powerStatusColor,
  powerStatusShortLabel,
  powerStatusTint,
} from "@/components/energy/energy-labels";

type Section = "claim" | "prices";
type View2 = "available" | "saved" | "vouchers" | "history";

function segmentIconColor(active: boolean) {
  return active ? PH_COLORS.white : PH_COLORS.mutedForeground;
}

const SECTIONS: SegmentedOption<Section>[] = [
  {
    key: "claim",
    label: "Claim relief",
    icon: (active) => (
      <Basket size={17} color={segmentIconColor(active)} weight="fill" />
    ),
  },
  {
    key: "prices",
    label: "Price Watch",
    icon: (active) => (
      <Tag size={17} color={segmentIconColor(active)} weight="fill" />
    ),
  },
];

const VIEWS: SegmentedOption<View2>[] = [
  { key: "available", label: "Available" },
  { key: "saved", label: "Saved" },
  { key: "vouchers", label: "Vouchers" },
  { key: "history", label: "History" },
];

const STEPS = [
  { num: "1", text: "Reserve" },
  { num: "2", text: "Show QR" },
  { num: "3", text: "Collect" },
];

function initialSection(view?: string): Section {
  switch (view) {
    case "prices":
      return "prices";
    default:
      return "claim";
  }
}

function initialView(view?: string): View2 {
  switch (view) {
    case "saved":
      return "saved";
    case "vouchers":
      return "vouchers";
    case "history":
      return "history";
    default:
      return "available";
  }
}

function HowToStrip() {
  return (
    <View className="flex-row items-center rounded-3xl bg-secondary px-3 py-3">
      {STEPS.map((step, index) => (
        <View key={step.num} className="flex-1 flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
            <Text className="text-[11px] font-bold text-primary-foreground">
              {step.num}
            </Text>
          </View>
          <Text className="text-[12px] font-semibold text-foreground">
            {step.text}
          </Text>
          {index < STEPS.length - 1 ? (
            <View className="h-px flex-1 bg-primary/20" />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function PowerPill({ status }: { status: Location["power_status"] }) {
  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-2.5 py-1"
      style={{ backgroundColor: powerStatusTint(status) }}
    >
      <View
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: powerStatusColor(status) }}
      />
      <Text
        className="text-[11px] font-bold"
        style={{ color: powerStatusColor(status) }}
      >
        {powerStatusShortLabel(status)}
      </Text>
    </View>
  );
}

function QuantityPicker({
  value,
  unit,
  min,
  max,
  onChange,
}: {
  value: number;
  unit: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View className="flex-row items-center rounded-2xl bg-muted p-1.5">
      <Pressable
        disabled={atMin}
        onPress={() => onChange(Math.max(min, value - 1))}
        android_ripple={null}
        className={cn(
          "h-11 w-11 items-center justify-center rounded-xl bg-card active:opacity-70",
          atMin && "opacity-40",
        )}
      >
        <Minus size={17} weight="bold" color={PH_COLORS.blue} />
      </Pressable>

      <View className="flex-1 flex-row items-baseline justify-center gap-1">
        <Text className="text-xl font-bold text-foreground">{value}</Text>
        <Text className="text-[13px] font-medium text-muted-foreground">
          {unitLabel(unit)}
        </Text>
      </View>

      <Pressable
        disabled={atMax}
        onPress={() => onChange(Math.min(max, value + 1))}
        android_ripple={null}
        className={cn(
          "h-11 w-11 items-center justify-center rounded-xl bg-card active:opacity-70",
          atMax && "opacity-40",
        )}
      >
        <Plus size={17} weight="bold" color={PH_COLORS.blue} />
      </Pressable>
    </View>
  );
}

export default function CitizenLocations() {
  const eligibility = useEligibility();
  const locations = useLocations();
  const claim = useCreateAllocation();
  const saveReminder = useCreateReminder();
  const dialog = useDialog();
  const params = useLocalSearchParams<{ view?: string }>();
  const [section, setSection] = useState<Section>(initialSection(params.view));
  const [qty, setQty] = useState<Record<string, number>>({});
  const [view, setView] = useState<View2>(initialView(params.view));
  const [pending, setPending] = useState<{
    locationId: number;
    commodityId: number;
    quantity: number;
  } | null>(null);

  const programs = eligibility.data?.programs ?? [];
  const eligibleProgramIds = new Set(programs.map((p) => p.id));

  function capFor(programId: number | undefined): number | undefined {
    return programs.find((p) => p.id === programId)?.per_beneficiary_cap;
  }

  function claimableItems(location: Location): Inventory[] {
    return (location.inventories ?? []).filter(
      (inv) =>
        Number(inv.quantity_available) > 0 &&
        inv.commodity?.program_id !== undefined &&
        eligibleProgramIds.has(inv.commodity.program_id),
    );
  }

  const loading = eligibility.isLoading || locations.isLoading;

  const visibleLocations = (locations.data ?? [])
    .map((loc) => ({ loc, items: claimableItems(loc) }))
    .filter((entry) => entry.items.length > 0);

  const claimMarkers = visibleLocations
    .filter(({ loc }) => loc.latitude != null && loc.longitude != null)
    .map(({ loc }) => ({
      lat: Number(loc.latitude),
      lng: Number(loc.longitude),
      title: loc.name,
      color: loc.type === "gas_station" ? PH_COLORS.red : PH_COLORS.blue,
    }));

  function onClaim(locationId: number, commodityId: number, quantity: number) {
    claim.mutate(
      { location_id: locationId, commodity_id: commodityId, quantity },
      {
        onSuccess: () => {
          setView("vouchers");
          dialog.alert({
            title: "Reserved for you!",
            message:
              "Your goods are saved. Show the code or QR here in the Vouchers tab at the store.",
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

  function toYmd(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function onSave(
    locationId: number,
    commodityId: number,
    quantity: number,
    remindOn: string,
  ) {
    saveReminder.mutate(
      {
        location_id: locationId,
        commodity_id: commodityId,
        quantity,
        remind_on: remindOn,
      },
      {
        onSuccess: (reminder) => {
          setView("saved");
          scheduleClaimReminder({
            id: reminder.id,
            title: "Time to claim your relief",
            body: `${reminder.commodity.name ?? "Your item"} at ${
              reminder.location.name ?? "the store"
            }`,
            date: reminder.remind_on ?? remindOn,
          });
          dialog.alert({
            title: "Saved to your plan",
            message:
              "Find it in the Saved tab. We'll remind you on your chosen day.",
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not save",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  function onPickDate(event: DateTimePickerEvent, date?: Date) {
    const target = pending;
    setPending(null);
    if (event.type !== "set" || !date || !target) return;
    onSave(target.locationId, target.commodityId, target.quantity, toYmd(date));
  }

  function renderLocation({
    loc,
    items,
  }: {
    loc: Location;
    items: Inventory[];
  }) {
    const isStore = loc.type === "kadiwa_store";
    const accent = isStore ? PH_COLORS.blue : PH_COLORS.red;
    const offline = loc.power_status === "offline";

    return (
      <View key={loc.id} className="gap-2.5 rounded-[26px] bg-muted p-2.5">
        <View className="flex-row items-center gap-3 px-1.5 pt-1.5">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: isStore ? "#e8effb" : "#fce8ea" }}
          >
            {isStore ? (
              <Storefront size={22} color={accent} weight="duotone" />
            ) : (
              <GasPump size={22} color={accent} weight="duotone" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-foreground">
              {loc.name}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {isStore ? "Kadiwa Store" : "Gas Station"}
              {loc.barangay ? ` · ${loc.barangay}` : ""}
            </Text>
          </View>
          <PowerPill status={loc.power_status} />
        </View>

        {offline ? (
          <View
            className="mx-1 rounded-2xl p-3"
            style={{ backgroundColor: "#fce8ea" }}
          >
            <Text className="text-xs text-foreground">
              No power here right now. Claiming is paused so you do not waste
              the fare. Try another site below.
            </Text>
          </View>
        ) : null}

        {loc.power_status === "generator" ? (
          <View
            className="mx-1 rounded-2xl p-3"
            style={{ backgroundColor: "#fdf1cf" }}
          >
            <Text className="text-xs text-foreground">
              Running on a backup generator. Still open for claiming.
            </Text>
          </View>
        ) : null}

        {items.map((inv) => {
          const available = Math.floor(Number(inv.quantity_available));
          const unit = inv.commodity?.unit ?? "";
          const cap = capFor(inv.commodity?.program_id);
          const max = Math.max(1, Math.min(available, cap ?? available));
          const key = `${loc.id}:${inv.commodity_id}`;
          const value = Math.min(qty[key] ?? 1, max);
          const claimingThis =
            claim.isPending &&
            claim.variables?.commodity_id === inv.commodity_id &&
            claim.variables?.location_id === loc.id;
          const savingThis =
            saveReminder.isPending &&
            saveReminder.variables?.commodity_id === inv.commodity_id &&
            saveReminder.variables?.location_id === loc.id;

          return (
            <View
              key={inv.commodity_id}
              className="gap-3 rounded-[22px] bg-card p-4"
            >
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">
                    {inv.commodity?.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {available} {unitLabel(unit)} in stock
                    {cap !== undefined ? ` · your limit ${cap}` : ""}
                  </Text>
                </View>
              </View>

              <QuantityPicker
                value={value}
                unit={unit}
                min={1}
                max={max}
                onChange={(v) => setQty((s) => ({ ...s, [key]: v }))}
              />

              <Button
                variant="success"
                label={
                  offline ? "Unavailable during brownout" : `Claim ${value} ${unitLabel(unit)}`
                }
                disabled={offline}
                loading={claimingThis}
                onPress={() => onClaim(loc.id, inv.commodity_id, value)}
              />

              <Pressable
                disabled={savingThis}
                onPress={() =>
                  setPending({
                    locationId: loc.id,
                    commodityId: inv.commodity_id,
                    quantity: value,
                  })
                }
                android_ripple={null}
                className="active:opacity-60"
              >
                <Text className="text-center text-xs font-semibold text-primary">
                  {savingThis ? "Saving..." : "Remind me instead"}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <Screen
      refreshing={locations.isRefetching}
      onRefresh={() => locations.refetch()}
    >
      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Relief
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Reserve your goods, or check prices near you.
        </Text>
      </View>

      <GridAlertBanner />

      <Segmented
        value={section}
        onChange={(next) => setSection(next)}
        options={SECTIONS}
      />

      {section === "prices" ? (
        <PriceList />
      ) : (
        <>
          <ChipRow value={view} onChange={(next) => setView(next)} options={VIEWS} />

          {view === "history" ? <ClaimHistory /> : null}
          {view === "vouchers" ? <MyVouchers /> : null}
          {view === "saved" ? (
            <ClaimRemindersList onClaimed={() => setView("vouchers")} />
          ) : null}

          {view === "available" ? (
            <>
              <HowToStrip />

              {loading ? (
                <View className="gap-3">
                  {[0, 1].map((i) => (
                    <Skeleton key={i} className="h-52 w-full rounded-[26px]" />
                  ))}
                </View>
              ) : locations.isError ? (
                <Text className="text-destructive">
                  Couldn&apos;t load the stores.
                </Text>
              ) : visibleLocations.length === 0 ? (
                <EmptyState
                  icon={Basket}
                  title="Nothing to claim yet"
                  description="There is nothing available for you right now. Pull down to refresh, or check back later."
                />
              ) : (
                <>
                  {claimMarkers.length > 0 ? (
                    <View className="overflow-hidden rounded-3xl">
                      <LeafletMap markers={claimMarkers} />
                    </View>
                  ) : null}
                  {visibleLocations.map(renderLocation)}
                </>
              )}
            </>
          ) : null}

          {pending ? (
            <DateTimePicker
              value={new Date()}
              mode="date"
              minimumDate={new Date()}
              onChange={onPickDate}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}
