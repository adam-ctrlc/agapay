import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Link } from "expo-router";
import { CaretRight, MagnifyingGlass, MapPin } from "phosphor-react-native";

import type { PriceCategory } from "@/lib/api/prices";
import { usePriceRegions, usePrices } from "@/lib/queries/prices";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { IconInput } from "@/components/ui/icon-input";
import { CategoryIcon, TrendIndicator } from "@/components/price-indicators";

const CATEGORIES: { key: PriceCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fuel", label: "Fuel" },
  { key: "fare", label: "Fare" },
  { key: "commodity", label: "Market" },
];

function Pill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "rounded-full px-3 py-1.5",
        active ? "bg-primary" : "bg-muted",
      )}
    >
      <Text
        className={cn(
          "text-sm font-medium",
          active ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function PriceList() {
  const [category, setCategory] = useState<PriceCategory | "all">("all");
  const [region, setRegion] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const regions = usePriceRegions();
  const query = usePrices(category, region);

  const items = useMemo(() => {
    const data = query.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((p) => p.name.toLowerCase().includes(term));
  }, [query.data, search]);

  return (
    <View className="gap-3">
      <IconInput
        icon={<MagnifyingGlass size={20} color={PH_COLORS.mutedForeground} />}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Search a commodity, fuel, or fare"
      />

      <View className="gap-1">
        <View className="flex-row items-center gap-1">
          <MapPin size={14} color={PH_COLORS.mutedForeground} />
          <Text variant="caption">Region</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 pr-4"
        >
          <Pill
            label="All PH"
            active={region === undefined}
            onPress={() => setRegion(undefined)}
          />
          {regions.data?.map((r) => (
            <Pill
              key={r}
              label={r}
              active={region === r}
              onPress={() => setRegion(r)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="flex-row gap-2">
        {CATEGORIES.map((c) => (
          <Pill
            key={c.key}
            label={c.label}
            active={category === c.key}
            onPress={() => setCategory(c.key)}
          />
        ))}
      </View>

      {query.isLoading ? (
        <View className="gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-2xl" />
          ))}
        </View>
      ) : query.isError ? (
        <Text className="text-destructive">Couldn&apos;t load prices.</Text>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MagnifyingGlass}
          title="No prices found"
          description="Nothing matches that search. Try a different item name or clear the filter."
          tint={PH_COLORS.white}
          color={PH_COLORS.mutedForeground}
        />
      ) : (
        <View className="gap-3">
          {items.map((price) => (
            <Link key={price.id} href={`/prices/${price.id}`} asChild>
              <Pressable className="active:opacity-80">
                <Card className="flex-row items-center gap-3">
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <CategoryIcon category={price.category} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text variant="label">{price.name}</Text>
                    <Text variant="caption">
                      {price.region} · {price.unit}
                    </Text>
                  </View>
                  <View className="items-end gap-0.5">
                    <Text className="text-lg font-bold">
                      ₱{price.value.toFixed(2)}
                    </Text>
                    <TrendIndicator
                      trend={price.trend}
                      changePercent={price.change_percent}
                    />
                  </View>
                  <CaretRight size={16} color={PH_COLORS.mutedForeground} />
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}
