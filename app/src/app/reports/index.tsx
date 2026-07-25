import { View } from "react-native";

import { useIncidentReports } from "@/lib/queries/incident-reports";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { RoleGate } from "@/components/role-gate";
import { BackBar } from "@/components/back-bar";
import { ReportsAdmin } from "@/components/reports-admin";

export default function Reports() {
  const reports = useIncidentReports();

  return (
    <RoleGate role="lgu_admin">
      <Screen
        edges={["top"]}
        refreshing={reports.isRefetching}
        onRefresh={() => reports.refetch()}
      >
        <BackBar />

        <View className="gap-0.5">
          <Text className="text-[28px] font-bold leading-tight text-foreground">
            Incident reports
          </Text>
        </View>

        <ReportsAdmin />
      </Screen>
    </RoleGate>
  );
}
