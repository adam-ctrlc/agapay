import {
  Boat,
  Buildings,
  Car,
  Drop,
  Fire,
  FirstAid,
  Lightning,
  Mountains,
  ShieldWarning,
  Warning,
  type IconProps,
} from "phosphor-react-native";

import { PH_COLORS } from "@/lib/theme";
import type { IncidentType } from "@/lib/api/incident-reports";

type Indicator = { Icon: React.ComponentType<IconProps>; tint: string; color: string };

const RED = { tint: "#fce8ea", color: PH_COLORS.red };
const BLUE = { tint: "#e8effb", color: PH_COLORS.blue };
const AMBER = { tint: "#fdf1cf", color: "#8a6800" };
const GREEN = { tint: "#e1f3ec", color: PH_COLORS.success };

const INDICATORS: Record<IncidentType, Indicator> = {
  flood: { Icon: Drop, ...BLUE },
  fire: { Icon: Fire, ...RED },
  landslide: { Icon: Mountains, ...AMBER },
  earthquake_damage: { Icon: Buildings, ...AMBER },
  road_blocked: { Icon: Car, ...AMBER },
  power_line_down: { Icon: Lightning, ...AMBER },
  medical: { Icon: FirstAid, ...RED },
  sea_incident: { Icon: Boat, ...BLUE },
  security: { Icon: ShieldWarning, ...RED },
  other: { Icon: Warning, ...GREEN },
};

export function incidentTint(type: IncidentType): string {
  return INDICATORS[type].tint;
}

export function IncidentIcon({
  type,
  size = 20,
}: {
  type: IncidentType;
  size?: number;
}) {
  const { Icon, color } = INDICATORS[type];

  return <Icon size={size} color={color} weight="duotone" />;
}
