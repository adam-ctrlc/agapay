import { ChatCircleText, Keyboard, QrCode } from "phosphor-react-native";

import { PH_COLORS } from "@/lib/theme";
import type { SegmentedOption } from "@/components/ui/segmented";

export type ScanMode = "scan" | "sms" | "token";

function tint(active: boolean) {
  return active ? PH_COLORS.white : PH_COLORS.mutedForeground;
}

export const SCAN_MODES: SegmentedOption<ScanMode>[] = [
  {
    key: "scan",
    label: "Scan",
    icon: (active) => <QrCode size={16} color={tint(active)} weight="bold" />,
  },
  {
    key: "sms",
    label: "SMS",
    icon: (active) => (
      <ChatCircleText size={16} color={tint(active)} weight="bold" />
    ),
  },
  {
    key: "token",
    label: "Token",
    icon: (active) => <Keyboard size={16} color={tint(active)} weight="bold" />,
  },
];

export function manualLabel(mode: ScanMode) {
  return mode === "sms" ? "6-digit SMS code" : "Voucher token";
}

export function manualPlaceholder(mode: ScanMode) {
  return mode === "sms" ? "123456" : "Paste voucher token";
}
