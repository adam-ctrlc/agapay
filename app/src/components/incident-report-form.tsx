import { useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Crosshair, MapPin, Trash } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { IncidentType, LocationSource } from "@/lib/api/incident-reports";
import { useCreateIncidentReport } from "@/lib/queries/incident-reports";
import { useDeviceLocation } from "@/lib/use-device-location";
import { captureIncidentPhoto, pickIncidentPhoto } from "@/lib/incident-photo";
import { PH_PROVINCES } from "@/lib/geo/ph-provinces";
import { PROVINCE_ANCHORS } from "@/lib/geo/province-anchors";
import { latLngToSvg, svgToLatLng } from "@/lib/geo/svg-to-latlng";
import { provinceAt } from "@/lib/geo/point-in-province";
import {
  ISLAND_GROUP_LABEL,
  islandGroupFor,
} from "@/lib/geo/island-groups";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDialog } from "@/components/ui/dialog";
import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";
import { LocationMap, type MapPoint } from "@/components/reports/location-map";

const TYPE_OPTIONS: SegmentedOption<IncidentType>[] = [
  { key: "flood", label: "Flooding" },
  { key: "fire", label: "Fire" },
  { key: "landslide", label: "Landslide" },
  { key: "earthquake_damage", label: "Quake damage" },
  { key: "road_blocked", label: "Road blocked" },
  { key: "power_line_down", label: "Downed line" },
  { key: "medical", label: "Medical" },
  { key: "sea_incident", label: "Sea incident" },
  { key: "security", label: "Security" },
  { key: "other", label: "Other" },
];

export function IncidentReportForm() {
  const router = useRouter();
  const create = useCreateIncidentReport();
  const location = useDeviceLocation();
  const dialog = useDialog();

  const [type, setType] = useState<IncidentType>("flood");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provinceCode, setProvinceCode] = useState<string | null>(null);
  const [provinceQuery, setProvinceQuery] = useState("");
  const [point, setPoint] = useState<MapPoint | null>(null);
  const [source, setSource] = useState<LocationSource>("manual_province");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busyPhoto, setBusyPhoto] = useState(false);

  const fix = location.state.status === "granted" ? location.state.fix : null;
  const provinceName = PH_PROVINCES.find((p) => p.code === provinceCode)?.title;
  const group = islandGroupFor(provinceCode);

  const matches = useMemo(() => {
    const q = provinceQuery.trim().toLowerCase();
    if (!q) return [];
    return PH_PROVINCES.filter((p) => p.title.toLowerCase().includes(q)).slice(
      0,
      6,
    );
  }, [provinceQuery]);

  async function useMyLocation() {
    const found = await location.locate();

    if (found === null) return;

    const next = latLngToSvg(found.latitude, found.longitude);

    setPoint(next);
    setSource("gps");

    const guess = provinceAt(next.x, next.y);
    if (guess !== null) setProvinceCode(guess.code);
  }

  function pickProvince(code: string) {
    setProvinceCode(code);
    setProvinceQuery("");

    /**
     * Anchors the pin so the map has something to show, but the report still
     * goes out with no coordinates. A province centroid is not a location the
     * reporter chose, and sending it would fake a precision they never gave.
     */
    if (source !== "gps" && source !== "manual_map") {
      setPoint(PROVINCE_ANCHORS[code] ?? null);
    }
  }

  function pickOnMap(next: MapPoint, code: string | null) {
    setPoint(next);
    setSource("manual_map");
    if (code !== null) setProvinceCode(code);
  }

  function clearLocation() {
    location.reset();
    setPoint(null);
    setSource("manual_province");
  }

  function coordinates() {
    switch (source) {
      case "gps":
        return {
          latitude: fix?.latitude ?? null,
          longitude: fix?.longitude ?? null,
          accuracy_meters:
            fix?.accuracy != null ? Math.round(fix.accuracy) : null,
        };
      case "manual_map": {
        const ll = point ? svgToLatLng(point.x, point.y) : null;
        return {
          latitude: ll?.latitude ?? null,
          longitude: ll?.longitude ?? null,
          accuracy_meters: null,
        };
      }
      default:
        return { latitude: null, longitude: null, accuracy_meters: null };
    }
  }

  async function addPhoto(capture: boolean) {
    setBusyPhoto(true);

    try {
      const encoded = capture
        ? await captureIncidentPhoto()
        : await pickIncidentPhoto();

      if (encoded === null) {
        dialog.alert({
          title: "No photo added",
          message:
            "Permission was declined, or the photo was still too large after shrinking. You can send the report without one.",
        });
        return;
      }

      setPhoto(encoded);
    } finally {
      setBusyPhoto(false);
    }
  }

  function submit() {
    if (provinceCode === null) {
      dialog.alert({
        title: "Where is this?",
        message: "Use your location, tap the map, or pick the province.",
      });
      return;
    }

    create.mutate(
      {
        type,
        title: title.trim(),
        description: description.trim(),
        location_source: source,
        province_code: provinceCode,
        photo_thumbnail: photo,
        ...coordinates(),
      },
      {
        onSuccess: () => {
          dialog.alert({
            title: "Report sent",
            message:
              "Your LGU can see it now. Follow it under Account, My reports.",
          });
          router.back();
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not send",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  return (
    <>
      <SectionLabel>What is happening?</SectionLabel>
      <ChipRow
        value={type}
        onChange={(next) => setType(next)}
        options={TYPE_OPTIONS}
      />

      <View className="gap-3 rounded-[28px] border border-border bg-card p-4">
        <Field label="Title">
          <Input
            value={title}
            onChangeText={setTitle}
            placeholder="Waist-deep flooding on Commonwealth Ave"
          />
        </Field>

        <Field label="What are you seeing?">
          <Input
            value={description}
            onChangeText={setDescription}
            multiline
            className="h-24 py-3"
            style={{ textAlignVertical: "top" }}
            placeholder="The southbound lane is impassable and the water is rising."
          />
        </Field>
      </View>

      <SectionLabel>Location</SectionLabel>
      <View className="gap-3 rounded-[28px] border border-border bg-card p-4">
        {source === "gps" && fix ? (
          <View className="gap-1.5">
            <View className="flex-row flex-wrap items-center gap-2">
              <Badge variant="success" label="Using your location" />
              {fix.accuracy != null ? (
                <Text className="text-[12px] text-muted-foreground">
                  accurate to about {Math.round(fix.accuracy)}m
                </Text>
              ) : null}
            </View>
            <Text className="text-[12px] text-muted-foreground">
              {fix.latitude.toFixed(4)}, {fix.longitude.toFixed(4)}
            </Text>
          </View>
        ) : (
          <Button
            variant="secondary"
            label={
              location.state.status === "locating"
                ? "Finding you..."
                : "Use my current location"
            }
            loading={location.state.status === "locating"}
            onPress={useMyLocation}
          />
        )}

        {location.state.status === "denied" ? (
          <Text className="text-[12px] text-muted-foreground">
            Location permission was declined. Tap the map or pick a province
            instead.
          </Text>
        ) : null}

        {location.state.status === "unavailable" ? (
          <Text className="text-[12px] text-muted-foreground">
            Could not get a fix. Tap the map or pick a province instead.
          </Text>
        ) : null}

        <View className="gap-2 border-t border-border pt-3">
          <View className="flex-row items-center gap-2">
            <MapPin size={15} color={PH_COLORS.blue} weight="fill" />
            <Text className="flex-1 text-[13px] font-bold text-foreground">
              {provinceName ?? "No province yet"}
            </Text>
            {provinceCode ? (
              <Badge variant="muted" label={ISLAND_GROUP_LABEL[group]} />
            ) : null}
          </View>

          {provinceCode ? (
            <LocationMap
              group={group}
              point={point}
              selectedCode={provinceCode}
              onPick={pickOnMap}
            />
          ) : (
            <Text className="text-[12px] text-muted-foreground">
              Pick a province to open its map, or use your current location.
            </Text>
          )}

          <View className="gap-2">
            <Input
              value={provinceQuery}
              onChangeText={setProvinceQuery}
              autoCapitalize="words"
              placeholder={provinceCode ? "Change province" : "Search a province"}
            />
            {matches.map((p) => (
              <Pressable
                key={p.code}
                onPress={() => pickProvince(p.code)}
                android_ripple={null}
                className="rounded-2xl border border-border px-4 py-2.5 active:opacity-70"
              >
                <Text className="text-[14px] font-semibold text-foreground">
                  {p.title}
                </Text>
              </Pressable>
            ))}
          </View>

          {point || fix ? (
            <Pressable hitSlop={6} onPress={clearLocation}>
              <Text className="text-[12px] font-semibold text-destructive">
                Clear the pin
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <SectionLabel>Photo (optional)</SectionLabel>
      <View className="gap-3 rounded-[28px] border border-border bg-card p-4">
        {photo ? (
          <View className="gap-2">
            <Image
              source={{ uri: photo }}
              className="h-40 w-full rounded-2xl"
              resizeMode="cover"
            />
            <Pressable
              className="flex-row items-center gap-1.5"
              onPress={() => setPhoto(null)}
            >
              <Trash size={15} color={PH_COLORS.red} />
              <Text className="text-[12px] font-semibold text-destructive">
                Remove photo
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <Button
              className="flex-1"
              variant="outline"
              label="Take photo"
              loading={busyPhoto}
              onPress={() => addPhoto(true)}
            />
            <Button
              className="flex-1"
              variant="outline"
              label="Choose photo"
              loading={busyPhoto}
              onPress={() => addPhoto(false)}
            />
          </View>
        )}
      </View>

      <Button
        label="Send report"
        loading={create.isPending}
        disabled={!title.trim() || !description.trim() || provinceCode === null}
        onPress={submit}
      />

      <View className="flex-row items-start gap-2 pb-2">
        <Crosshair size={13} color={PH_COLORS.mutedForeground} />
        <Text className="flex-1 text-[11px] text-muted-foreground">
          Your LGU reviews every report before it reaches the public impact map.
        </Text>
      </View>
    </>
  );
}
