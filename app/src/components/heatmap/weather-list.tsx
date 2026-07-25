import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { CaretLeft, CaretRight, MagnifyingGlass } from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type { ProvinceWeather } from "@/lib/api/weather";
import {
  useClearWeatherOverride,
  useOverrideWeather,
  useWeatherPage,
} from "@/lib/queries/weather";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Group } from "@/components/ui/list-group";
import { EmptyState } from "@/components/ui/empty-state";
import { useDialog } from "@/components/ui/dialog";
import { IconInput } from "@/components/ui/icon-input";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { colorForRatio } from "@/components/heatmap/severity-scale";

const PER_PAGE = 8;

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
      android_ripple={null}
      className={cn(
        "rounded-full px-4 py-2 active:opacity-70",
        active ? "bg-primary" : "bg-muted",
      )}
    >
      <Text
        className={cn(
          "text-[13px] font-semibold",
          active ? "text-primary-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function WeatherOverrideRow({ province }: { province: ProvinceWeather }) {
  const override = useOverrideWeather();
  const clear = useClearWeatherOverride();
  const dialog = useDialog();
  const [open, setOpen] = useState(false);
  const [rain, setRain] = useState("");
  const [note, setNote] = useState("");

  function submit() {
    if (!rain.trim() || !note.trim()) {
      dialog.alert({
        title: "Source required",
        message:
          "Enter the rainfall and say where the reading came from. Manual values are published with their source.",
      });
      return;
    }

    override.mutate(
      {
        code: province.code,
        body: { precipitation: Number(rain), weather_note: note.trim() },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setRain("");
          setNote("");
        },
        onError: (e) =>
          dialog.alert({
            title: "Could not set",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  if (!open) {
    return (
      <View className="flex-row gap-2 border-t border-border pt-2">
        <Pressable hitSlop={6} onPress={() => setOpen(true)}>
          <Text className="text-xs font-semibold text-primary">
            {province.is_live ? "Set manually" : "Change"}
          </Text>
        </Pressable>
        {province.is_live ? null : (
          <Pressable hitSlop={6} onPress={() => clear.mutate(province.code)}>
            <Text className="text-xs font-semibold text-destructive">
              Resume live data
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View className="gap-2 border-t border-border pt-2">
      <Input
        value={rain}
        onChangeText={setRain}
        keyboardType="decimal-pad"
        placeholder="Rainfall in mm"
      />
      <Input
        value={note}
        onChangeText={setNote}
        placeholder="Where did this reading come from?"
      />
      <View className="flex-row gap-2">
        <Button
          className="flex-1"
          variant="secondary"
          label="Save"
          loading={override.isPending}
          disabled={!rain.trim() || !note.trim()}
          onPress={submit}
        />
        <Button
          className="flex-1"
          variant="outline"
          label="Cancel"
          onPress={() => setOpen(false)}
        />
      </View>
    </View>
  );
}

export function WeatherList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "lgu_admin";
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, condition]);

  const query = useWeatherPage({
    search,
    condition: condition ?? undefined,
    sort: "name",
    page,
    perPage: PER_PAGE,
  });

  const rows = query.data?.data ?? [];
  const conditions = query.data?.conditions ?? [];
  const meta = query.data?.meta;
  const maxPrecip = Math.max(1, ...rows.map((w) => w.precipitation ?? 0));

  const pending = query.isLoading || query.isPlaceholderData;
  const lastPage = meta?.last_page ?? 1;

  return (
    <View className="gap-3">
      <IconInput
        icon={<MagnifyingGlass size={20} color={PH_COLORS.mutedForeground} />}
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Search a province"
        autoCapitalize="none"
      />

      <View className="flex-row flex-wrap gap-2">
        <Chip
          label="All"
          active={condition === null}
          onPress={() => setCondition(null)}
        />
        {conditions.map((c) => (
          <Chip
            key={c}
            label={c}
            active={condition === c}
            onPress={() => setCondition(c)}
          />
        ))}
      </View>

      {pending ? (
        <Skeleton className="h-64 w-full rounded-3xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={MagnifyingGlass}
          title="No matches"
          description="No province matches that name. Try a different spelling or clear the filter."
          tint={PH_COLORS.white}
          color={PH_COLORS.mutedForeground}
        />
      ) : (
        <Group>
          {rows.map((w, index) => (
            <View
              key={w.code}
              className={cn(
                "gap-2 px-4 py-3.5",
                index !== rows.length - 1 && "border-b border-border",
              )}
            >
              <View className="flex-row items-center gap-3">
                <View
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: colorForRatio(
                      (w.precipitation ?? 0) / maxPrecip,
                    ),
                  }}
                />
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground">
                    {w.name ?? w.code}
                  </Text>
                  <Text className="text-[12px] text-muted-foreground">
                    {w.description ?? "—"}
                    {w.temperature != null
                      ? ` · ${Math.round(w.temperature)}°C`
                      : ""}
                    {(w.precipitation ?? 0) > 0
                      ? ` · ${w.precipitation}mm rain`
                      : ""}
                    {w.wind_speed != null
                      ? ` · ${Math.round(w.wind_speed)} km/h`
                      : ""}
                  </Text>
                </View>
                {w.is_live ? null : <Badge variant="accent" label="manual" />}
              </View>

              {w.is_live ? null : (
                <Text className="text-[12px] text-muted-foreground">
                  Set by the LGU, not a live reading{w.note ? `: ${w.note}` : "."}
                </Text>
              )}

              {isAdmin ? <WeatherOverrideRow province={w} /> : null}
            </View>
          ))}
        </Group>
      )}

      {lastPage > 1 ? (
        <View className="flex-row items-center justify-between">
          <Pressable
            disabled={page <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            android_ripple={null}
            className={cn(
              "flex-row items-center gap-1 rounded-full bg-muted px-4 py-2 active:opacity-70",
              page <= 1 && "opacity-40",
            )}
          >
            <CaretLeft size={15} color={PH_COLORS.foreground} weight="bold" />
            <Text className="text-[13px] font-semibold text-foreground">
              Prev
            </Text>
          </Pressable>
          <Text className="text-[12px] font-medium text-muted-foreground">
            Page {page} of {lastPage}
          </Text>
          <Pressable
            disabled={page >= lastPage}
            onPress={() => setPage((p) => Math.min(lastPage, p + 1))}
            android_ripple={null}
            className={cn(
              "flex-row items-center gap-1 rounded-full bg-muted px-4 py-2 active:opacity-70",
              page >= lastPage && "opacity-40",
            )}
          >
            <Text className="text-[13px] font-semibold text-foreground">
              Next
            </Text>
            <CaretRight size={15} color={PH_COLORS.foreground} weight="bold" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
