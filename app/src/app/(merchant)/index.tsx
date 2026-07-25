import { useMemo, useState } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle, Lightning, Storefront } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { Redemption } from "@/lib/api/redemptions";
import { useRedeem } from "@/lib/queries/redemptions";
import { useLocations } from "@/lib/queries/locations";
import { useVoucherKey } from "@/lib/queries/voucher-key";
import { useAuth } from "@/lib/auth/context";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Segmented } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";
import { NotificationBell } from "@/components/notification-bell";
import { GridAlertBanner } from "@/components/energy/grid-alert-banner";
import { powerStatusShortLabel } from "@/components/energy/energy-labels";
import { ScannerFrame } from "@/components/merchant/scanner-frame";
import {
  SCAN_MODES,
  manualLabel,
  manualPlaceholder,
  type ScanMode,
} from "@/components/merchant/scan-modes";

const CARD_COLORS = ["#0b2f8f", "#0038a8", "#1a5ee0"] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Magandang umaga";
  if (hour < 18) return "Magandang hapon";
  return "Magandang gabi";
}

function tokenFromScan(data: string) {
  try {
    const parsed = JSON.parse(data) as { token?: unknown };
    if (parsed && typeof parsed.token === "string") return parsed.token;
  } catch {
    // not JSON; treat the raw value as the token
  }
  return data;
}

export default function MerchantRedeem() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ScanMode>("scan");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Redemption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const mutation = useRedeem();
  const locations = useLocations();
  const voucherKey = useVoucherKey();

  const firstName =
    user?.first_name?.trim() || user?.name?.split(" ")[0] || "Vendor";

  const store = useMemo(
    () =>
      (locations.data ?? []).find((l) => l.id === user?.location_id) ?? null,
    [locations.data, user?.location_id],
  );

  function redeem(credential: { token: string } | { sms_code: string }) {
    mutation.mutate(credential, {
      onSuccess: (r) => {
        setResult(r);
        setError(null);
        setValue("");
      },
      onError: (e) => {
        setError(e instanceof ApiError ? e.message : "Redemption failed.");
        setResult(null);
      },
    });
  }

  function onManualRedeem() {
    redeem(
      mode === "token" ? { token: value.trim() } : { sms_code: value.trim() },
    );
  }

  function onScan(data: string) {
    if (scanned || mutation.isPending) return;
    setScanned(true);
    redeem({ token: tokenFromScan(data) });
  }

  function resetScan() {
    setScanned(false);
    setResult(null);
    setError(null);
  }

  return (
    <Screen
      refreshing={locations.isRefetching}
      onRefresh={() => locations.refetch()}
    >
      <View className="flex-row items-center justify-between gap-3 pt-1">
        <View className="flex-1">
          <Text className="text-[13px] font-medium text-muted-foreground">
            {greeting()},
          </Text>
          <Text className="text-[28px] font-bold leading-tight text-foreground">
            {firstName}
          </Text>
        </View>
        <NotificationBell />
      </View>

      {locations.isLoading ? (
        <Skeleton className="h-32 w-full rounded-[28px]" />
      ) : (
        <LinearGradient
          colors={CARD_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, overflow: "hidden" }}
        >
          <View
            pointerEvents="none"
            className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/10"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/5"
          />

          <View className="gap-4 p-5">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                <Storefront size={22} color={PH_COLORS.white} weight="fill" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Redeeming at
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-lg font-bold leading-tight text-white"
                >
                  {store?.name ?? "No store assigned"}
                </Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2">
              <View className="rounded-full bg-white/15 px-3 py-1.5">
                <Text className="text-[11px] font-bold text-white">
                  {store ? powerStatusShortLabel(store.power_status) : "Unassigned"}
                </Text>
              </View>
              {store?.barangay ? (
                <View className="rounded-full bg-white/15 px-3 py-1.5">
                  <Text className="text-[11px] font-bold text-white">
                    {store.barangay}
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
                <Lightning
                  size={12}
                  color={PH_COLORS.white}
                  weight={voucherKey.data ? "fill" : "regular"}
                />
                <Text className="text-[11px] font-bold text-white">
                  {voucherKey.data ? "Offline ready" : "No offline key"}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      <GridAlertBanner />

      <SectionLabel>How are you redeeming?</SectionLabel>
      <Segmented
        value={mode}
        onChange={(next) => {
          setMode(next);
          resetScan();
        }}
        options={SCAN_MODES}
      />

      {mode === "scan" ? (
        <>
          <ScannerFrame
            paused={scanned || mutation.isPending}
            caption={
              mutation.isPending
                ? "Verifying voucher..."
                : "Point the camera at the citizen's voucher QR."
            }
            onScan={onScan}
          />
          {scanned || result ? (
            <Button variant="outline" label="Scan again" onPress={resetScan} />
          ) : null}
        </>
      ) : (
        <View className="gap-3 rounded-[28px] border border-border bg-card p-4">
          <Field label={manualLabel(mode)}>
            <Input
              value={value}
              onChangeText={setValue}
              autoCapitalize="none"
              keyboardType={mode === "sms" ? "number-pad" : "default"}
              placeholder={manualPlaceholder(mode)}
            />
          </Field>
          <Button
            label="Redeem"
            loading={mutation.isPending}
            disabled={!value.trim()}
            onPress={onManualRedeem}
          />
        </View>
      )}

      {error ? (
        <View
          className="rounded-3xl p-4"
          style={{ backgroundColor: "#fce8ea" }}
        >
          <Text className="text-[13px] font-semibold text-destructive">
            {error}
          </Text>
        </View>
      ) : null}

      {result ? (
        <View
          className="items-center gap-1 rounded-[28px] p-6"
          style={{ backgroundColor: "#e1f3ec" }}
        >
          <CheckCircle size={44} color={PH_COLORS.success} weight="fill" />
          <Text className="mt-1 text-[17px] font-bold text-foreground">
            Voucher redeemed
          </Text>
          <Text className="text-[32px] font-bold leading-tight text-foreground">
            {result.quantity}
          </Text>
          <Text className="text-center text-[13px] text-muted-foreground">
            Hand over the goods to the citizen. Confirmed via {result.source}.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}
