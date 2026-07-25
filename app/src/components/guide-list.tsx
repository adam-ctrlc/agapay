import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Link } from "expo-router";
import { CaretRight, MagnifyingGlass } from "phosphor-react-native";

import type { GuideCategory } from "@/lib/api/guides";
import { useGuides } from "@/lib/queries/guides";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IconInput } from "@/components/ui/icon-input";
import { GUIDE_CATEGORY_LABEL, GuideIcon } from "@/components/guide-indicators";

const CATEGORIES: { key: GuideCategory | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "id", label: "IDs" },
  { key: "benefit", label: "Benefits" },
  { key: "document", label: "Documents" },
  { key: "relief", label: "Relief" },
  { key: "tax", label: "Tax & BIR" },
  { key: "work", label: "Work" },
  { key: "business", label: "Business" },
  { key: "travel", label: "Travel" },
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

export function GuideList() {
  const [category, setCategory] = useState<GuideCategory | "all">("all");
  const [search, setSearch] = useState("");

  const query = useGuides(category === "all" ? undefined : category);

  const items = useMemo(() => {
    const data = query.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((g) =>
      [g.title, g.agency, g.summary]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query.data, search]);

  return (
    <View className="gap-3">
      <IconInput
        icon={<MagnifyingGlass size={20} color={PH_COLORS.mutedForeground} />}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Search an ID, benefit, or document"
      />

      <View className="flex-row flex-wrap gap-2">
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
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[92px] w-full rounded-2xl" />
          ))}
        </View>
      ) : query.isError ? (
        <Text className="text-destructive">Couldn&apos;t load guides.</Text>
      ) : items.length === 0 ? (
        <EmptyState
          icon={MagnifyingGlass}
          title="No guides found"
          description="Nothing matches that search. Try a shorter word, or pick a different category."
          tint={PH_COLORS.white}
          color={PH_COLORS.mutedForeground}
        />
      ) : (
        <View className="gap-3">
          {items.map((guide) => (
            <Link key={guide.id} href={`/guides/${guide.id}`} asChild>
              <Pressable className="active:opacity-80">
                <Card className="gap-2">
                  <View className="flex-row items-center gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                      <GuideIcon category={guide.category} />
                    </View>
                    <View className="flex-1 gap-0.5">
                      <Text variant="label" numberOfLines={2}>
                        {guide.title}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Badge variant="secondary" label={guide.agency} />
                        <Text variant="caption">
                          {GUIDE_CATEGORY_LABEL[guide.category]}
                        </Text>
                      </View>
                    </View>
                    <CaretRight size={18} color={PH_COLORS.mutedForeground} />
                  </View>
                  <Text variant="caption" numberOfLines={2}>
                    {guide.summary}
                  </Text>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}
