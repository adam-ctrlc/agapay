import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  Basket,
  BellRinging,
  BookOpen,
  Megaphone,
  Tag,
} from "phosphor-react-native";

import { useEligibility } from "@/lib/queries/eligibility";
import { useClaimReminders } from "@/lib/queries/claim-reminders";
import { useAuth } from "@/lib/auth/context";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { ActionTile } from "@/components/ui/action-tile";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketSnapshot } from "@/components/market-snapshot";
import { LatestAlerts } from "@/components/latest-alerts";
import { GridAlertBanner } from "@/components/energy/grid-alert-banner";
import { NotificationBell } from "@/components/notification-bell";

const CARD_COLORS = ["#0b2f8f", "#0038a8", "#1a5ee0"] as const;

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Magandang umaga";
  if (hour < 18) return "Magandang hapon";
  return "Magandang gabi";
}

export default function CitizenHome() {
  const { user } = useAuth();
  const firstName =
    user?.first_name?.trim() || user?.name?.split(" ")[0] || "Kabayan";
  const eligibility = useEligibility();
  const reminders = useClaimReminders();
  const dueCount = (reminders.data ?? []).filter((r) => r.due).length;
  const programs = eligibility.data?.programs ?? [];
  const headline = programs[0];

  const refreshing = eligibility.isRefetching;
  const onRefresh = useCallback(() => {
    eligibility.refetch();
  }, [eligibility]);

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

      {eligibility.isLoading ? (
        <Skeleton className="h-44 w-full rounded-[28px]" />
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

          <View className="gap-5 p-5">
            {headline ? (
              <>
                <View className="gap-1">
                  <Text className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Ready to claim
                  </Text>
                  <View className="flex-row items-end gap-2">
                    <Text className="text-[44px] font-bold leading-none text-white">
                      {headline.per_beneficiary_cap}
                    </Text>
                    <Text className="pb-1.5 text-lg font-semibold text-white/80">
                      {headline.unit}
                    </Text>
                  </View>
                  <Text className="text-sm text-white/70">
                    {headline.name}
                    {programs.length > 1
                      ? ` and ${programs.length - 1} more program${programs.length > 2 ? "s" : ""}`
                      : ""}
                  </Text>
                </View>

                <Link href="/(citizen)/locations" asChild>
                  <Pressable className="flex-row items-center justify-center gap-2 rounded-2xl bg-white py-3.5 active:opacity-80">
                    <Text className="text-[15px] font-bold text-primary">
                      Find a place to claim
                    </Text>
                    <ArrowRight size={17} color={PH_COLORS.blue} weight="bold" />
                  </Pressable>
                </Link>
              </>
            ) : (
              <View className="gap-4 py-2">
                <View className="gap-1">
                  <Text className="text-xl font-bold text-white">
                    Not listed yet
                  </Text>
                  <Text className="text-sm text-white/70">
                    You are not on a relief programme right now. Your LGU adds
                    households as lists are verified.
                  </Text>
                </View>
                <Link href="/guides" asChild>
                  <Pressable className="flex-row items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 active:opacity-80">
                    <Text className="text-sm font-bold text-white">
                      See what to prepare
                    </Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </View>
        </LinearGradient>
      )}

      {dueCount > 0 ? (
        <Link href="/(citizen)/locations?view=saved" asChild>
          <Pressable className="active:opacity-80">
            <View
              className="flex-row items-center gap-3 rounded-3xl p-4"
              style={{ backgroundColor: "#fff6d6" }}
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent">
                <BellRinging size={20} color="#3a2e00" weight="fill" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  {dueCount} plan{dueCount > 1 ? "s" : ""} to claim today
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Tap to review your saved plans
                </Text>
              </View>
              <ArrowRight size={16} color="#3a2e00" weight="bold" />
            </View>
          </Pressable>
        </Link>
      ) : null}

      <GridAlertBanner />

      <View className="flex-row gap-3">
        <ActionTile
          href="/(citizen)/locations"
          label="Claim"
          tint="#e8effb"
          icon={<Basket size={26} color={PH_COLORS.blue} weight="duotone" />}
        />
        <ActionTile
          href="/(citizen)/locations?view=prices"
          label="Prices"
          tint="#fdf1cf"
          icon={<Tag size={26} color="#8a6800" weight="duotone" />}
        />
        <ActionTile
          href="/report"
          label="Report"
          tint="#fce8ea"
          icon={<Megaphone size={26} color={PH_COLORS.red} weight="duotone" />}
        />
        <ActionTile
          href="/guides"
          label="Gabay"
          tint="#e1f3ec"
          icon={<BookOpen size={26} color={PH_COLORS.success} weight="duotone" />}
        />
      </View>

      <MarketSnapshot />

      <LatestAlerts />
    </Screen>
  );
}
