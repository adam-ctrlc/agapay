import { useMemo } from "react";
import { Tag } from "phosphor-react-native";
import { Pressable, View } from "react-native";
import { Link } from "expo-router";

import type { PriceCategory, PriceReference } from "@/lib/api/prices";
import { PH_COLORS } from "@/lib/theme";
import { usePrices } from "@/lib/queries/prices";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionLabel } from "@/components/ui/list-group";
import {
  CategoryIcon,
  TrendIndicator,
  trendColor,
} from "@/components/price-indicators";

const ORDER: PriceCategory[] = ["fuel", "fare", "commodity"];

function pickHighlights(data: PriceReference[]) {
  return ORDER.map((cat) => data.find((p) => p.category === cat)).filter(
    (p): p is PriceReference => Boolean(p),
  );
}

function ChangeBar({ price }: { price: PriceReference }) {
  const pct = price.change_percent;
  const width = pct === null ? 6 : Math.min(Math.max(Math.abs(pct) * 5, 6), 100);

  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-muted">
      <View
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          backgroundColor: trendColor(price.trend, pct),
        }}
      />
    </View>
  );
}

function PriceRow({ price, last }: { price: PriceReference; last: boolean }) {
  return (
    <View className={cn("gap-2 px-4 py-3.5", !last && "border-b border-border")}>
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
          <CategoryIcon category={price.category} size={18} />
        </View>
        <View className="flex-1">
          <Text
            numberOfLines={1}
            className="text-[15px] font-semibold text-foreground"
          >
            {price.name}
          </Text>
          <Text className="text-[12px] text-muted-foreground">
            {price.unit}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text className="text-[17px] font-bold text-foreground">
            ₱{price.value.toFixed(2)}
          </Text>
          <TrendIndicator
            trend={price.trend}
            changePercent={price.change_percent}
          />
        </View>
      </View>
      <ChangeBar price={price} />
    </View>
  );
}

export function MarketSnapshot() {
  const query = usePrices("all");
  const highlights = useMemo(
    () => pickHighlights(query.data ?? []),
    [query.data],
  );

  return (
    <>
      <SectionLabel
        action={
          <Link href="/(citizen)/locations?view=prices" asChild>
            <Pressable hitSlop={8} className="active:opacity-60">
              <Text className="text-[13px] font-semibold text-primary">
                See all
              </Text>
            </Pressable>
          </Link>
        }
      >
        Market snapshot
      </SectionLabel>

      {query.isLoading ? (
        <Skeleton className="h-52 w-full rounded-3xl" />
      ) : query.isError || highlights.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Prices unavailable"
          description="We could not load the market prices. Pull down to try again."
          tint={PH_COLORS.white}
          color={PH_COLORS.mutedForeground}
        />
      ) : (
        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          {highlights.map((price, index) => (
            <PriceRow
              key={price.id}
              price={price}
              last={index === highlights.length - 1}
            />
          ))}
        </View>
      )}
    </>
  );
}
