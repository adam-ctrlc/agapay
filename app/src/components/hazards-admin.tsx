import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { PencilSimple, Trash, Warning } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { HazardEvent, HazardType } from "@/lib/api/hazards";
import {
  useCreateHazard,
  useUpdateHazard,
  useDeleteHazard,
  useHazards,
} from "@/lib/queries/hazards";
import { PH_PROVINCES } from "@/lib/geo/ph-provinces";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDialog } from "@/components/ui/dialog";
import { useScreenScroll } from "@/components/ui/screen";
import { colorForRatio } from "@/components/heatmap/severity-scale";
import { hazardLabel, hazardWhen } from "@/components/heatmap/hazard-labels";

const TYPES: { key: HazardType; label: string }[] = [
  { key: "typhoon", label: "Typhoon" },
  { key: "flood", label: "Flood" },
  { key: "earthquake", label: "Earthquake" },
  { key: "fire", label: "Fire" },
  { key: "other", label: "Other" },
];

export function HazardsAdmin() {
  const hazards = useHazards();
  const create = useCreateHazard();
  const update = useUpdateHazard();
  const remove = useDeleteHazard();
  const dialog = useDialog();
  const { scrollToTop } = useScreenScroll();

  const [type, setType] = useState<HazardType>("typhoon");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [affected, setAffected] = useState("");
  const [severity, setSeverity] = useState("50");
  const [editingId, setEditingId] = useState<number | null>(null);

  const matches = useMemo(() => {
    const q = provinceQuery.trim().toLowerCase();
    if (!q) return [];
    return PH_PROVINCES.filter((p) => p.title.toLowerCase().includes(q)).slice(
      0,
      6,
    );
  }, [provinceQuery]);

  const provinceName = PH_PROVINCES.find((p) => p.code === provinceCode)?.title;

  function startEdit(hazard: HazardEvent) {
    setEditingId(hazard.id);
    setType(hazard.type);
    setTitle(hazard.title);
    setPlace(hazard.place ?? "");
    setProvinceCode(hazard.province_code ?? null);
    setProvinceQuery("");
    setAffected(
      hazard.affected_people != null ? String(hazard.affected_people) : "",
    );
    setSeverity(String(hazard.severity));
    scrollToTop();
  }

  function reset() {
    setEditingId(null);
    setType("typhoon");
    setTitle("");
    setPlace("");
    setProvinceCode(null);
    setProvinceQuery("");
    setAffected("");
    setSeverity("50");
  }

  function post() {
    const sev = Number(severity);
    if (!title.trim() || !provinceCode) {
      dialog.alert("Add a title and choose a province.");
      return;
    }
    if (!Number.isFinite(sev) || sev < 0 || sev > 100) {
      dialog.alert("Severity must be a number from 0 to 100.");
      return;
    }
    const body = {
      type,
      title: title.trim(),
      place: place.trim() || provinceName || null,
      province_code: provinceCode,
      affected_people: affected.trim() ? Number(affected) : null,
      severity: Math.round(sev),
    };

    if (editingId !== null) {
      update.mutate(
        { id: editingId, body },
        {
          onSuccess: () => {
            reset();
            dialog.alert({
              title: "Updated",
              message: "The hazard has been changed.",
            });
          },
          onError: (e) =>
            dialog.alert({
              title: "Could not update",
              message: e instanceof ApiError ? e.message : "Please try again.",
            }),
        },
      );
      return;
    }

    create.mutate(
      {
        type,
        title: title.trim(),
        place: place.trim() || provinceName || null,
        province_code: provinceCode,
        affected_people: affected.trim() ? Number(affected) : null,
        severity: Math.round(sev),
      },
      {
        onSuccess: () => {
          reset();
          dialog.alert({
            title: "Published",
            message: "The hazard now shows on the impact map.",
          });
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not publish",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  async function confirmDelete(id: number, label: string) {
    const ok = await dialog.confirm({
      title: "Remove hazard?",
      message: `"${label}" will be removed from the map.`,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (ok) remove.mutate(id);
  }

  return (
    <>
      <Text variant="subtitle">
        Report typhoons, floods, and other events. Earthquakes sync
        automatically.
      </Text>

      <Card>
        <CardHeader>
          <CardTitle>{editingId === null ? "New hazard" : "Edit hazard"}</CardTitle>
        </CardHeader>
        <View className="gap-3">
          <Field label="Type">
            <View className="flex-row flex-wrap gap-2">
              {TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setType(t.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5",
                    type === t.key ? "bg-primary" : "bg-muted",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      type === t.key
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Field>

          <Field label="Title">
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Typhoon flooding, river overflow, etc."
            />
          </Field>

          <Field label="Province">
            {provinceCode ? (
              <Pressable
                onPress={() => {
                  setProvinceCode(null);
                  setProvinceQuery("");
                }}
                className="h-12 flex-row items-center justify-between rounded-xl border border-input bg-muted px-4"
              >
                <Text variant="label">{provinceName}</Text>
                <Text variant="caption" className="text-primary">
                  Change
                </Text>
              </Pressable>
            ) : (
              <View className="gap-2">
                <Input
                  value={provinceQuery}
                  onChangeText={setProvinceQuery}
                  autoCapitalize="words"
                  placeholder="Search a province"
                />
                {matches.map((p) => (
                  <Pressable
                    key={p.code}
                    onPress={() => {
                      setProvinceCode(p.code);
                      setProvinceQuery("");
                    }}
                    className="rounded-xl border border-border px-4 py-2.5 active:opacity-70"
                  >
                    <Text variant="label">{p.title}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Field>

          <Field label="People affected (optional)">
            <Input
              value={affected}
              onChangeText={setAffected}
              keyboardType="number-pad"
              placeholder="e.g. 12000"
            />
          </Field>

          <Field label="Severity (0 to 100)">
            <Input
              value={severity}
              onChangeText={setSeverity}
              keyboardType="number-pad"
              placeholder="50"
            />
          </Field>

          <Button
            label={editingId === null ? "Publish hazard" : "Save changes"}
            loading={create.isPending || update.isPending}
            disabled={!title.trim() || !provinceCode || !severity.trim()}
            onPress={post}
          />
          {editingId !== null ? (
            <Button variant="outline" label="Cancel edit" onPress={reset} />
          ) : null}
        </View>
      </Card>

      <Text variant="heading">Reported hazards</Text>
      {hazards.isLoading ? (
        <View className="gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </View>
      ) : (hazards.data ?? []).length === 0 ? (
        <EmptyState
          icon={Warning}
          title="No hazards yet"
          description="Publish one above and it shades the public impact map straight away."
          compact
        />
      ) : (
        <View className="gap-3">
          {hazards.data?.map((hazard) => (
            <Card key={hazard.id} className="flex-row items-start gap-3">
              <View
                className="mt-1 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colorForRatio(hazard.severity / 100) }}
              />
              <View className="flex-1 gap-0.5">
                <Text variant="label" numberOfLines={1}>
                  {hazardLabel(hazard.type)} · {hazard.title}
                </Text>
                <Text variant="caption">
                  {hazard.place ? `${hazard.place} · ` : ""}
                  sev {hazard.severity} · {hazardWhen(hazard.occurred_at)}
                  {hazard.source === "usgs" ? " · USGS" : ""}
                </Text>
              </View>
              {hazard.source !== "usgs" ? (
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => startEdit(hazard)}
                    hitSlop={8}
                    className="active:opacity-60"
                  >
                    <PencilSimple size={18} color={PH_COLORS.blue} />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(hazard.id, hazard.title)}
                    hitSlop={8}
                    className="active:opacity-60"
                  >
                    <Trash size={18} color={PH_COLORS.red} />
                  </Pressable>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </>
  );
}
