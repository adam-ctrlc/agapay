import type { GridLevel, PowerStatus } from "@/lib/api/energy";
import { PH_COLORS } from "@/lib/theme";

export function gridLevelVariant(level: GridLevel) {
  switch (level) {
    case "red":
      return "destructive" as const;
    case "yellow":
      return "accent" as const;
    default:
      return "success" as const;
  }
}

export function powerStatusVariant(status: PowerStatus) {
  switch (status) {
    case "offline":
      return "destructive" as const;
    case "generator":
      return "accent" as const;
    default:
      return "success" as const;
  }
}

export function powerStatusLabel(status: PowerStatus): string {
  switch (status) {
    case "offline":
      return "No power";
    case "generator":
      return "On generator";
    default:
      return "Powered";
  }
}

export function powerStatusShortLabel(status: PowerStatus | null | undefined): string {
  switch (status) {
    case "offline":
      return "No power";
    case "generator":
      return "Generator";
    default:
      return "Open";
  }
}

export function powerStatusTint(status: PowerStatus | null | undefined): string {
  switch (status) {
    case "offline":
      return "#fce8ea";
    case "generator":
      return "#fdf1cf";
    default:
      return "#e1f3ec";
  }
}

export function powerStatusColor(status: PowerStatus | null | undefined): string {
  switch (status) {
    case "offline":
      return PH_COLORS.red;
    case "generator":
      return PH_COLORS.yellow;
    default:
      return PH_COLORS.success;
  }
}

export function interruptionWindow(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const time = (d: Date) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const sameDay = start.toDateString() === end.toDateString();
  const day = start.toLocaleDateString([], { month: "short", day: "numeric" });

  return sameDay
    ? `${day}, ${time(start)} to ${time(end)}`
    : `${time(start)} to ${time(end)}`;
}
