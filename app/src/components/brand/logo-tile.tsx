import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { G, Line, Rect } from "react-native-svg";

import { LogoMark } from "@/components/brand/logo-mark";

const LOGO_COLORS = ["#0b2f8f", "#0038a8", "#1a5ee0"] as const;
const STROKE = "rgba(255,255,255,0.24)";

const FLOORS = [
  [2, 48, 30],
  [2, 62, 30],
  [2, 76, 30],
  [2, 90, 30],
  [35, 28, 66],
  [35, 44, 66],
  [35, 60, 66],
  [35, 76, 66],
  [35, 92, 66],
  [71, 58, 99],
  [71, 72, 99],
  [71, 86, 99],
];

/**
 * Oversized tower outlines running off the edges of the tile, so the mark
 * reads as standing in a city rather than floating on flat blue.
 */
function Skyline({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <G stroke={STROKE} strokeWidth={2.4} fill="none">
        <Rect x={2} y={34} width={28} height={78} rx={3} />
        <Rect x={35} y={12} width={31} height={100} rx={3} />
        <Rect x={71} y={44} width={28} height={68} rx={3} />
        {FLOORS.map(([x1, y, x2]) => (
          <Line key={`${x1}-${y}`} x1={x1} y1={y} x2={x2} y2={y} />
        ))}
      </G>
    </Svg>
  );
}

export function LogoTile({
  size = 84,
  radius = 26,
  mark = 56,
}: {
  size?: number;
  radius?: number;
  mark?: number;
}) {
  return (
    <LinearGradient
      colors={LOGO_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        height: size,
        width: size,
        borderRadius: radius,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View style={{ position: "absolute", top: 0, left: 0 }}>
        <Skyline size={size} />
      </View>
      <LogoMark size={mark} />
    </LinearGradient>
  );
}
