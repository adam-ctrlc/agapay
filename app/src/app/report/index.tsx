import { View } from "react-native";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { RoleGate } from "@/components/role-gate";
import { BackBar } from "@/components/back-bar";
import { IncidentReportForm } from "@/components/incident-report-form";

export default function Report() {
  return (
    <RoleGate role="citizen">
      <Screen edges={["top"]}>
        <BackBar />

        <View className="gap-0.5">
          <Text className="text-[28px] font-bold leading-tight text-foreground">
            Report an incident
          </Text>
          <Text className="text-[13px] text-muted-foreground">
            Your LGU reviews this, then refers it to the right agency. Follow it
            under Account, My reports.
          </Text>
        </View>

        <IncidentReportForm />
      </Screen>
    </RoleGate>
  );
}
