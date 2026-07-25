import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  Lightning,
  Megaphone,
  Storefront,
  Tag,
} from "phosphor-react-native";

import { useDashboardStats, useHeatmap } from "@/lib/queries/dashboard";
import { useIncidentReports } from "@/lib/queries/incident-reports";
import { useMerchants } from "@/lib/queries/merchants";
import { useAuth } from "@/lib/auth/context";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionTile } from "@/components/ui/action-tile";
import { ActionRow, Group, SectionLabel } from "@/components/ui/list-group";
import { LeafletMap } from "@/components/leaflet-map";
import { NotificationBell } from "@/components/notification-bell";

const HERO_COLORS = ["#0b2f8f", "#0038a8", "#1a5ee0"] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Magandang umaga";
  if (hour < 18) return "Magandang hapon";
  return "Magandang gabi";
}

function compact(value: number): string {
  switch (true) {
    case value >= 1_000_000:
      return `${(value / 1_000_000).toFixed(1)}M`;
    case value >= 1_000:
      return `${(value / 1_000).toFixed(1)}k`;
    default:
      return String(Math.round(value));
  }
}

function depletionColor(rate: number) {
  if (rate >= 0.7) return PH_COLORS.red;
  if (rate >= 0.4) return PH_COLORS.yellow;
  return PH_COLORS.success;
}

function DepletionBar({ rate }: { rate: number }) {
  const pct = Math.min(100, Math.round(rate * 100));

  return (
    <View className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <View
        style={{ width: `${pct}%`, backgroundColor: depletionColor(rate) }}
        className="h-full rounded-full"
      />
    </View>
  );
}

export default function LguDashboard() {
  const { user } = useAuth();
  const stats = useDashboardStats();
  const heatmap = useHeatmap();
  const router = useRouter();
  const pending = useIncidentReports({ status: "submitted" });
  const merchants = useMerchants("pending");

  const firstName =
    user?.first_name?.trim() || user?.name?.split(" ")[0] || "Admin";
  const pendingReports = (pending.data ?? []).length;
  const pendingMerchants = (merchants.data ?? []).length;

  const refreshing = stats.isRefetching || heatmap.isRefetching;
  const onRefresh = useCallback(() => {
    stats.refetch();
    heatmap.refetch();
  }, [stats, heatmap]);

  const heatMarkers = (heatmap.data ?? [])
    .filter((b) => b.latitude != null && b.longitude != null)
    .map((b) => ({
      lat: Number(b.latitude),
      lng: Number(b.longitude),
      title: `${b.name}: ${Math.round(b.depletion_rate * 100)}% depleted`,
      color: depletionColor(b.depletion_rate),
    }));

  const blocked = stats.data?.blocked_claims;
  const locks = stats.data?.active_locks;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
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

      {stats.isLoading ? (
        <Skeleton className="h-44 w-full rounded-[28px]" />
      ) : (
        <LinearGradient
          colors={HERO_COLORS}
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

          <View className="gap-5 p-5">
            <View className="gap-1">
              <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Vouchers out right now
              </Text>
              <View className="flex-row items-end gap-2">
                <Text className="text-[44px] font-bold leading-none text-white">
                  {locks?.count ?? 0}
                </Text>
                <Text className="pb-1.5 text-lg font-semibold text-white/80">
                  locked
                </Text>
              </View>
              <Text className="text-sm text-white/70">
                {locks?.quantity ?? 0} units reserved and waiting to be
                collected.
              </Text>
            </View>

            <Link href="/relief" asChild>
              <Pressable className="flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5 active:opacity-80">
                <Text className="text-[15px] font-bold text-primary">
                  Open relief operations
                </Text>
                <ArrowRight size={17} color={PH_COLORS.blue} weight="bold" />
              </Pressable>
            </Link>
          </View>
        </LinearGradient>
      )}

      {pendingReports > 0 ? (
        <Link href="/reports" asChild>
          <Pressable className="active:opacity-80">
            <View
              className="flex-row items-center gap-3 rounded-3xl p-4"
              style={{ backgroundColor: "#fce8ea" }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-destructive">
                <Megaphone size={20} color={PH_COLORS.white} weight="fill" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  {pendingReports} report{pendingReports > 1 ? "s" : ""} awaiting
                  review
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Verify them, then refer to an agency
                </Text>
              </View>
              <ArrowRight size={16} color={PH_COLORS.red} weight="bold" />
            </View>
          </Pressable>
        </Link>
      ) : null}

      {pendingMerchants > 0 ? (
        <Link href="/merchants" asChild>
          <Pressable className="active:opacity-80">
            <View
              className="flex-row items-center gap-3 rounded-3xl p-4"
              style={{ backgroundColor: "#fdf1cf" }}
            >
              <View
                className="h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "#f6e3ab" }}
              >
                <Storefront size={20} color="#8a6800" weight="fill" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  {pendingMerchants} store{pendingMerchants > 1 ? "s" : ""} waiting
                  for approval
                </Text>
                <Text className="text-xs text-muted-foreground">
                  They cannot redeem anything until you approve them
                </Text>
              </View>
              <ArrowRight size={16} color="#8a6800" weight="bold" />
            </View>
          </Pressable>
        </Link>
      ) : null}

      <View className="flex-row gap-3">
        <ActionTile
          href="/reports"
          label="Reports"
          tint="#fce8ea"
          icon={<Megaphone size={26} color={PH_COLORS.red} weight="duotone" />}
        />
        <ActionTile
          href="/relief"
          label="Relief"
          tint="#e8effb"
          icon={<Storefront size={26} color={PH_COLORS.blue} weight="duotone" />}
        />
        <ActionTile
          href="/(lgu)/prices"
          label="Prices"
          tint="#fdf1cf"
          icon={<Tag size={26} color="#8a6800" weight="duotone" />}
        />
        <ActionTile
          href="/(lgu)/hazards"
          label="Risk"
          tint="#e1f3ec"
          icon={
            <Lightning size={26} color={PH_COLORS.success} weight="duotone" />
          }
        />
      </View>

      <SectionLabel>Manage</SectionLabel>
      <Group>
        <ActionRow
          icon={
            <Storefront size={19} color={PH_COLORS.blue} weight="duotone" />
          }
          label="Merchants"
          hint="Approve stores and pause access"
          badge={
            pendingMerchants > 0 ? (
              <Badge variant="accent" label={String(pendingMerchants)} />
            ) : undefined
          }
          onPress={() => router.push("/merchants")}
          last
        />
      </Group>

      {blocked && blocked.total > 0 ? (
        <>
          <SectionLabel>Leakage prevented</SectionLabel>
          <View className="gap-3 rounded-3xl border border-border bg-card p-4">
            <View className="flex-row items-baseline gap-2">
              <Text className="text-[32px] font-bold leading-none text-foreground">
                {blocked.leakage_prevented}
              </Text>
              <Text className="flex-1 text-xs text-muted-foreground">
                ghost, duplicate or over-cap claims refused before any stock or
                money moved.
              </Text>
            </View>
            {blocked.by_reason.map((r) => (
              <View
                key={r.reason}
                className="flex-row items-center justify-between border-t border-border pt-2.5"
              >
                <Text className="flex-1 text-[13px] text-muted-foreground">
                  {r.label}
                </Text>
                <Badge
                  variant={r.is_leakage_prevented ? "destructive" : "muted"}
                  label={String(r.count)}
                />
              </View>
            ))}
          </View>
        </>
      ) : null}

      {stats.data && stats.data.subsidies_by_program.length > 0 ? (
        <>
          <SectionLabel>Subsidies released</SectionLabel>
          <Group>
            {stats.data.subsidies_by_program.map((s, index) => (
              <View
                key={s.program_id}
                className={
                  index < stats.data.subsidies_by_program.length - 1
                    ? "flex-row items-center gap-3 border-b border-border px-4 py-3.5"
                    : "flex-row items-center gap-3 px-4 py-3.5"
                }
              >
                <Text className="flex-1 text-[14px] font-semibold text-foreground">
                  {s.program_name}
                </Text>
                <Text className="text-[14px] font-bold text-primary">
                  {s.quantity} {s.unit}
                </Text>
              </View>
            ))}
          </Group>
        </>
      ) : null}

      {stats.data && stats.data.redemptions_by_location.length > 0 ? (
        <>
          <SectionLabel>Redemptions by location</SectionLabel>
          <Group>
            {stats.data.redemptions_by_location.map((l, index) => (
              <View
                key={l.location_id}
                className={
                  index < stats.data.redemptions_by_location.length - 1
                    ? "gap-0.5 border-b border-border px-4 py-3.5"
                    : "gap-0.5 px-4 py-3.5"
                }
              >
                <Text className="text-[14px] font-semibold text-foreground">
                  {l.location_name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {l.redemptions} claims · {compact(l.quantity)} units
                </Text>
              </View>
            ))}
          </Group>
        </>
      ) : null}

      <SectionLabel>Barangay stock depletion</SectionLabel>

      {heatMarkers.length > 0 ? (
        <View className="overflow-hidden rounded-3xl">
          <LeafletMap markers={heatMarkers} height={260} />
        </View>
      ) : null}

      {heatmap.isLoading ? (
        <View className="gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-3xl" />
          ))}
        </View>
      ) : heatmap.isError ? (
        <Text className="text-destructive">Couldn&apos;t load heat map.</Text>
      ) : (
        (heatmap.data ?? []).map((b) => (
          <View
            key={b.barangay_id}
            className="gap-2.5 rounded-3xl border border-border bg-card p-4"
          >
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-foreground">
                  {b.name}
                </Text>
                <Text className="text-xs text-muted-foreground">{b.city}</Text>
              </View>
              <Text
                className="text-lg font-bold"
                style={{ color: depletionColor(b.depletion_rate) }}
              >
                {Math.round(b.depletion_rate * 100)}%
              </Text>
            </View>
            <DepletionBar rate={b.depletion_rate} />
            <View className="flex-row justify-between">
              <Text className="text-[11px] text-muted-foreground">
                Available {b.available}
              </Text>
              <Text className="text-[11px] text-muted-foreground">
                Locked {b.locked}
              </Text>
              <Text className="text-[11px] text-muted-foreground">
                Redeemed {b.redeemed}
              </Text>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
