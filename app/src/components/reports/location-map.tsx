import { useMemo, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import Svg, { Path } from "react-native-svg";
import { MapPin } from "phosphor-react-native";

import { PH_COLORS } from "@/lib/theme";
import { provinceAt } from "@/lib/geo/point-in-province";
import {
  fitViewBox,
  islandGroupViewBox,
  provincesInGroup,
  type IslandGroup,
} from "@/lib/geo/island-groups";
import { Text } from "@/components/ui/text";

export type MapPoint = { x: number; y: number };

const MIN_ASPECT = 0.72;
const MAX_ASPECT = 1.6;

function clamp(value: number, low: number, high: number) {
  return Math.min(high, Math.max(low, value));
}

export function LocationMap({
  group,
  point,
  selectedCode,
  onPick,
}: {
  group: IslandGroup;
  point: MapPoint | null;
  selectedCode: string | null;
  onPick: (point: MapPoint, provinceCode: string | null) => void;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const { box, aspect, provinces } = useMemo(() => {
    const raw = islandGroupViewBox(group);
    const fitted = clamp(raw.w / raw.h, MIN_ASPECT, MAX_ASPECT);

    return {
      box: fitViewBox(raw, fitted),
      aspect: fitted,
      provinces: provincesInGroup(group),
    };
  }, [group]);

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  }

  function handlePress(locationX: number, locationY: number) {
    if (size.width === 0 || size.height === 0) return;

    const x = box.x + (locationX / size.width) * box.w;
    const y = box.y + (locationY / size.height) * box.h;

    onPick({ x, y }, provinceAt(x, y)?.code ?? null);
  }

  const pin =
    point && size.width > 0
      ? {
          left: ((point.x - box.x) / box.w) * size.width,
          top: ((point.y - box.y) / box.h) * size.height,
        }
      : null;

  return (
    <View className="gap-2">
      <Pressable
        onLayout={onLayout}
        onPress={(e) =>
          handlePress(e.nativeEvent.locationX, e.nativeEvent.locationY)
        }
        className="w-full overflow-hidden rounded-[24px] border border-border bg-card"
        style={{ aspectRatio: aspect }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        >
          {provinces.map((province) => {
            const selected = province.code === selectedCode;

            return (
              <Path
                key={province.code}
                d={province.d}
                fill={selected ? PH_COLORS.blue : "#dbe3ee"}
                stroke="#ffffff"
                strokeWidth={0.6}
              />
            );
          })}
        </Svg>

        {pin ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: pin.left - 13,
              top: pin.top - 26,
            }}
          >
            <MapPin size={26} color={PH_COLORS.red} weight="fill" />
          </View>
        ) : null}
      </Pressable>

      <Text className="text-[11px] text-muted-foreground">
        Tap the map to move the pin. The pin is approximate, so your LGU also
        reads the description to find the exact spot.
      </Text>
    </View>
  );
}
