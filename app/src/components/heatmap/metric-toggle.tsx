import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import type { HeatMetric } from "@/components/heatmap/severity-scale";

const OPTIONS: SegmentedOption<HeatMetric>[] = [
  { key: "affected", label: "Affected" },
  { key: "severity", label: "Severity" },
  { key: "rainfall", label: "Rainfall" },
  { key: "outage", label: "Outages" },
];

export function MetricToggle({
  value,
  onChange,
}: {
  value: HeatMetric;
  onChange: (metric: HeatMetric) => void;
}) {
  return (
    <ChipRow
      value={value}
      onChange={(next) => onChange(next)}
      options={OPTIONS}
    />
  );
}
