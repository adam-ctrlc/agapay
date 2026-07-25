import Svg, { Circle, Path, Rect } from "react-native-svg";

import { PH_COLORS } from "@/lib/theme";

/**
 * The eight-ray Philippine sun rising over a government hall, with a heart in
 * the pediment: state services delivering the ayuda. Drawn rather than
 * installed because it is this app's own mark, so no icon library carries it.
 */
const SUN_RAYS = [
  "M28.6 11.65 L31.8 10.5 L28.6 9.35 Z",
  "M26.44 14.57 L29.52 16.02 L28.07 12.94 Z",
  "M22.85 15.1 L24 18.3 L25.15 15.1 Z",
  "M19.93 12.94 L18.48 16.02 L21.56 14.57 Z",
  "M19.4 9.35 L16.2 10.5 L19.4 11.65 Z",
  "M21.56 6.43 L18.48 4.98 L19.93 8.06 Z",
  "M25.15 5.9 L24 2.7 L22.85 5.9 Z",
  "M28.07 8.06 L29.52 4.98 L26.44 6.43 Z",
];

const COLUMNS = [13.55, 18.15, 22.75, 27.35, 31.95];

const PEDIMENT = "M11.5 26 L24 18.8 L36.5 26 Z";

const HEART =
  "M24 25.78 C21.8 24.1 20.75 23.17 20.75 21.9 C20.75 20.97 21.51 20.27 22.43 20.27 C23.07 20.27 23.65 20.62 24 21.14 C24.35 20.62 24.93 20.27 25.57 20.27 C26.49 20.27 27.25 20.97 27.25 21.9 C27.25 23.17 26.2 24.1 24 25.78 Z";

export function LogoMark({
  size = 44,
  color = PH_COLORS.white,
  accent = PH_COLORS.red,
}: {
  size?: number;
  color?: string;
  accent?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {SUN_RAYS.map((d) => (
        <Path key={d} d={d} fill={color} />
      ))}
      <Circle cx={24} cy={10.5} r={3.4} fill={color} />

      <Path d={PEDIMENT} fill={color} />
      <Rect x={12} y={26.4} width={24} height={2.2} rx={0.6} fill={color} />
      {COLUMNS.map((x) => (
        <Rect
          key={x}
          x={x}
          y={29.4}
          width={2.5}
          height={8.2}
          rx={0.5}
          fill={color}
        />
      ))}
      <Rect x={10.8} y={38} width={26.4} height={2.3} rx={0.7} fill={color} />
      <Rect x={9.2} y={40.8} width={29.6} height={2.5} rx={0.8} fill={color} />

      <Path d={HEART} fill={accent} />
    </Svg>
  );
}
