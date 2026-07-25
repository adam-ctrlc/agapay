import { useState } from "react";
import { Pressable, View } from "react-native";
import { Trash } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { PriceCategory } from "@/lib/api/prices";
import {
  useCreatePrice,
  usePrices,
  useDeletePrice,
  useUpdatePrice,
} from "@/lib/queries/prices";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES: SegmentedOption<PriceCategory>[] = [
  { key: "fuel", label: "Fuel" },
  { key: "fare", label: "Fare" },
  { key: "commodity", label: "Market" },
];

export default function LguPrices() {
  const prices = usePrices("all");
  const create = useCreatePrice();
  const update = useUpdatePrice();
  const remove = useDeletePrice();
  const dialog = useDialog();

  const [category, setCategory] = useState<PriceCategory>("fuel");
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("per liter");
  const [edits, setEdits] = useState<Record<number, string>>({});

  return (
    <Screen
      edges={["top"]}
      refreshing={prices.isRefetching}
      onRefresh={() => prices.refetch()}
    >
      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Prices
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Keep fuel, fare and market references current.
        </Text>
      </View>

      <SectionLabel>Add a price</SectionLabel>
      <View className="rounded-3xl border border-border bg-card p-4">
        <View className="gap-3">
          <Segmented
            value={category}
            onChange={(next) => setCategory(next)}
            options={CATEGORIES}
          />
          <Field label="Name">
            <Input value={name} onChangeText={setName} placeholder="Diesel" />
          </Field>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Field label="Value (PHP)">
                <Input
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                  placeholder="60.00"
                />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Unit">
                <Input value={unit} onChangeText={setUnit} placeholder="per liter" />
              </Field>
            </View>
          </View>
          <Button
            label="Add price"
            loading={create.isPending}
            disabled={!name.trim() || !unit.trim() || Number(value) <= 0}
            onPress={() => {
              if (!name.trim() || !Number(value)) {
                dialog.alert("Enter a name and a value.");
                return;
              }
              create.mutate(
                { category, name, value: Number(value), unit },
                {
                  onSuccess: () => {
                    setName("");
                    setValue("");
                    dialog.alert({
                      title: "Added",
                      message: "The new price is now live.",
                    });
                  },
                  onError: (e) =>
                    dialog.alert({
                      title: "Could not add",
                      message:
                        e instanceof ApiError ? e.message : "Please try again.",
                    }),
                },
              );
            }}
          />
        </View>
      </View>

      <View className="gap-3">
        <SectionLabel>Current prices</SectionLabel>
        {prices.isLoading ? (
          <View className="gap-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-3xl" />
            ))}
          </View>
        ) : (
          prices.data?.map((p) => (
            <View
              key={p.id}
              className="gap-3 rounded-3xl border border-border bg-card p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text variant="label">{p.name}</Text>
                  <Text variant="caption">
                    {p.category} · {p.unit}
                  </Text>
                </View>
                <Text className="text-lg font-bold">₱{p.value.toFixed(2)}</Text>
                <Pressable
                  hitSlop={8}
                  className="pl-3"
                  onPress={async () => {
                    const ok = await dialog.confirm({
                      title: `Remove ${p.name}?`,
                      message: `This deletes the ${p.region} reference and its price history.`,
                    });

                    if (ok) {
                      remove.mutate(p.id);
                    }
                  }}
                >
                  <Trash size={18} color={PH_COLORS.red} />
                </Pressable>
              </View>
              <View className="flex-row items-center gap-2">
                <Input
                  className="flex-1"
                  keyboardType="numeric"
                  placeholder="New value"
                  value={edits[p.id] ?? ""}
                  onChangeText={(t) =>
                    setEdits((s) => ({ ...s, [p.id]: t }))
                  }
                />
                <Button
                  size="sm"
                  variant="secondary"
                  label="Update"
                  loading={update.isPending && update.variables?.id === p.id}
                  disabled={Number(edits[p.id]) <= 0}
                  onPress={() => {
                    const v = Number(edits[p.id]);
                    if (!v || v <= 0) {
                      dialog.alert("Enter a new value.");
                      return;
                    }
                    update.mutate(
                      { id: p.id, value: v },
                      {
                        onSuccess: () =>
                          setEdits((s) => {
                            const next = { ...s };
                            delete next[p.id];
                            return next;
                          }),
                        onError: (e) =>
                          dialog.alert({
                            title: "Could not update",
                            message:
                              e instanceof ApiError
                                ? e.message
                                : "Please try again.",
                          }),
                      },
                    );
                  }}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
