import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Trash } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { Commodity } from "@/lib/api/eligibility";
import type { Location, LocationType } from "@/lib/api/locations";
import { useLocations } from "@/lib/queries/locations";
import {
  useCreateLocation,
  useDeleteLocation,
  usePrograms,
  useRestock,
  useUpdateProgram,
} from "@/lib/queries/relief";
import { unitLabel } from "@/lib/units";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDialog } from "@/components/ui/dialog";
import { BackBar } from "@/components/back-bar";
import { PowerStatusBadge } from "@/components/energy/power-status-badge";

type Barangay = { id: number; name: string };

const TYPES: { key: LocationType; label: string }[] = [
  { key: "kadiwa_store", label: "Kadiwa store" },
  { key: "gas_station", label: "Fuel station" },
];

function Chip({
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
        "rounded-xl border px-3 py-2",
        active ? "border-primary bg-primary" : "border-border bg-background",
      )}
    >
      <Text
        className={cn(
          "text-sm font-semibold",
          active ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RestockRow({
  location,
  commodities,
}: {
  location: Location;
  commodities: Commodity[];
}) {
  const restock = useRestock();
  const dialog = useDialog();
  const [commodityId, setCommodityId] = useState<number | null>(
    commodities[0]?.id ?? null,
  );
  const [amount, setAmount] = useState("");

  const current = location.inventories?.find(
    (i) => i.commodity_id === commodityId,
  );

  function submit() {
    if (commodityId === null || !amount.trim()) {
      dialog.alert({ title: "Set a quantity", message: "Enter the new stock level first." });
      return;
    }

    restock.mutate(
      {
        id: location.id,
        commodity_id: commodityId,
        quantity_available: Number(amount),
      },
      {
        onSuccess: () => {
          setAmount("");
          dialog.alert({
            title: "Stock updated",
            message: `${location.name} now shows the new level. Vouchers already locked are untouched.`,
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not restock",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  return (
    <View className="gap-2 border-t border-border pt-3">
      <View className="flex-row flex-wrap gap-2">
        {commodities.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            active={commodityId === c.id}
            onPress={() => setCommodityId(c.id)}
          />
        ))}
      </View>

      {current ? (
        <Text variant="caption">
          Now: {Number(current.quantity_available)} available
          {Number(current.quantity_locked) > 0
            ? `, ${Number(current.quantity_locked)} locked by citizens`
            : ""}
        </Text>
      ) : (
        <Text variant="caption">Not stocked here yet.</Text>
      )}

      <View className="flex-row gap-2">
        <Input
          className="flex-1"
          value={amount}
          onChangeText={setAmount}
          keyboardType="number-pad"
          placeholder="New stock level"
        />
        <Button
          variant="secondary"
          label="Set stock"
          loading={restock.isPending}
          disabled={commodityId === null || !amount.trim()}
          onPress={submit}
        />
      </View>
    </View>
  );
}

export function ReliefAdmin() {
  const locations = useLocations();
  const programs = usePrograms();
  const create = useCreateLocation();
  const remove = useDeleteLocation();
  const updateProgram = useUpdateProgram();
  const dialog = useDialog();

  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("kadiwa_store");
  const [barangayId, setBarangayId] = useState<number | null>(null);
  const [hasGenerator, setHasGenerator] = useState(false);
  const [caps, setCaps] = useState<Record<number, string>>({});

  const barangays = useMemo(() => {
    const seen = new Map<number, Barangay>();

    for (const location of locations.data ?? []) {
      if (location.barangay_id != null && location.barangay) {
        seen.set(location.barangay_id, {
          id: location.barangay_id,
          name: location.barangay,
        });
      }
    }

    return [...seen.values()];
  }, [locations.data]);

  const commoditiesFor = (location: Location): Commodity[] => {
    const wanted = location.type === "gas_station" ? "fuel" : "food";

    return (programs.data ?? [])
      .filter((p) => p.type === wanted)
      .flatMap((p) => p.commodities ?? []);
  };

  function submitLocation() {
    if (!name.trim() || barangayId === null) {
      dialog.alert({
        title: "Missing details",
        message: "A service point needs a name and a barangay.",
      });
      return;
    }

    const barangayName = barangays.find((b) => b.id === barangayId)?.name;

    create.mutate(
      {
        name: name.trim(),
        type,
        barangay_id: barangayId,
        has_generator: hasGenerator,
        is_active: true,
      },
      {
        onSuccess: () => {
          setName("");
          setHasGenerator(false);
          dialog.alert({
            title: "Service point added",
            message: `${name.trim()} is now open in ${barangayName ?? "the barangay"}. Set its stock below.`,
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not add",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  async function onDelete(location: Location) {
    const ok = await dialog.confirm({
      title: `Remove ${location.name}?`,
      message: "Citizens will no longer see it. Vouchers already locked here block removal.",
    });

    if (!ok) return;

    remove.mutate(location.id, {
      onError: (e) =>
        dialog.alert({
          title: "Could not remove",
          message: e instanceof ApiError ? e.message : "Please try again.",
        }),
    });
  }

  function saveCap(programId: number, unit: string) {
    const raw = caps[programId];

    if (!raw?.trim()) return;

    updateProgram.mutate(
      { id: programId, per_beneficiary_cap: Number(raw) },
      {
        onSuccess: () => {
          setCaps((c) => ({ ...c, [programId]: "" }));
          dialog.alert({
            title: "Cap updated",
            message: `Each beneficiary can now claim up to ${raw} ${unitLabel(unit)}.`,
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not update",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  return (
    <Screen edges={["top"]} refreshing={locations.isRefetching} onRefresh={() => locations.refetch()}>
      <BackBar />

      <View className="gap-0.5">
        <Text variant="title">Relief operations</Text>
        <Text variant="subtitle">
          Add service points, set stock, and adjust program caps.
        </Text>
      </View>

      <Text variant="heading">Program caps</Text>
      {programs.isLoading ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : (
        <View className="gap-2">
          {(programs.data ?? []).map((program) => (
            <Card key={program.id} className="gap-2">
              <Text variant="label">{program.name}</Text>
              <Text variant="caption">
                Cap: {program.per_beneficiary_cap} {unitLabel(program.unit)} per beneficiary
              </Text>
              <View className="flex-row gap-2">
                <Input
                  className="flex-1"
                  value={caps[program.id] ?? ""}
                  onChangeText={(v) => setCaps((c) => ({ ...c, [program.id]: v }))}
                  keyboardType="number-pad"
                  placeholder={String(program.per_beneficiary_cap)}
                />
                <Button
                  variant="secondary"
                  label="Save cap"
                  loading={updateProgram.isPending}
                  disabled={!(caps[program.id] ?? "").trim()}
                  onPress={() => saveCap(program.id, program.unit)}
                />
              </View>
            </Card>
          ))}
        </View>
      )}

      <Card className="gap-3">
        <CardHeader>
          <CardTitle>Add a service point</CardTitle>
        </CardHeader>

        <Field label="Name">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Kadiwa ng Pangulo - Barangay ..."
          />
        </Field>

        <Field label="Type">
          <View className="flex-row flex-wrap gap-2">
            {TYPES.map((t) => (
              <Chip
                key={t.key}
                label={t.label}
                active={type === t.key}
                onPress={() => setType(t.key)}
              />
            ))}
          </View>
        </Field>

        <Field label="Barangay">
          <View className="flex-row flex-wrap gap-2">
            {barangays.map((b) => (
              <Chip
                key={b.id}
                label={b.name}
                active={barangayId === b.id}
                onPress={() => setBarangayId(b.id)}
              />
            ))}
          </View>
        </Field>

        <Field label="Backup power">
          <View className="flex-row gap-2">
            <Chip
              label="Grid only"
              active={!hasGenerator}
              onPress={() => setHasGenerator(false)}
            />
            <Chip
              label="Has generator"
              active={hasGenerator}
              onPress={() => setHasGenerator(true)}
            />
          </View>
        </Field>

        <Button
          label="Add service point"
          loading={create.isPending}
          disabled={!name.trim() || barangayId === null}
          onPress={submitLocation}
        />
      </Card>

      <Text variant="heading">Service points</Text>
      {locations.isLoading ? (
        <View className="gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </View>
      ) : (
        <View className="gap-3">
          {(locations.data ?? []).map((location) => (
            <Card key={location.id} className="gap-3">
              <View className="flex-row items-start gap-3">
                <View className="flex-1 gap-1">
                  <Text variant="label">{location.name}</Text>
                  <Text variant="caption">
                    {location.type === "gas_station" ? "Fuel station" : "Kadiwa store"}
                    {location.barangay ? ` · ${location.barangay}` : ""}
                    {location.has_generator ? " · generator" : ""}
                  </Text>
                  <PowerStatusBadge status={location.power_status} />
                </View>
                <Pressable hitSlop={8} onPress={() => onDelete(location)}>
                  <Trash size={18} color={PH_COLORS.red} />
                </Pressable>
              </View>

              <RestockRow location={location} commodities={commoditiesFor(location)} />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
