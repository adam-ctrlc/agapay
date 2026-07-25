import { useState } from "react";
import { View } from "react-native";
import { Lightning, Warning } from "phosphor-react-native";

import { useHazards } from "@/lib/queries/hazards";
import { useInterruptions } from "@/lib/queries/energy";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Segmented, type SegmentedOption } from "@/components/ui/segmented";
import { HazardsAdmin } from "@/components/hazards-admin";
import { EnergyAdmin } from "@/components/energy-admin";

type Section = "hazards" | "power";

function segmentIconColor(active: boolean) {
  return active ? PH_COLORS.white : PH_COLORS.mutedForeground;
}

const SECTIONS: SegmentedOption<Section>[] = [
  {
    key: "hazards",
    label: "Hazards",
    icon: (active) => (
      <Warning size={17} color={segmentIconColor(active)} weight="fill" />
    ),
  },
  {
    key: "power",
    label: "Power",
    icon: (active) => (
      <Lightning size={17} color={segmentIconColor(active)} weight="fill" />
    ),
  },
];

export default function Risk() {
  const [section, setSection] = useState<Section>("hazards");
  const hazards = useHazards();
  const interruptions = useInterruptions();

  const active = section === "hazards" ? hazards : interruptions;

  return (
    <Screen
      refreshing={active.isRefetching}
      onRefresh={() => active.refetch()}
    >
      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Risk &amp; Power
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Report hazards and declare power interruptions.
        </Text>
      </View>

      <Segmented
        value={section}
        onChange={(next) => setSection(next)}
        options={SECTIONS}
      />

      {section === "hazards" ? <HazardsAdmin /> : <EnergyAdmin />}
    </Screen>
  );
}
