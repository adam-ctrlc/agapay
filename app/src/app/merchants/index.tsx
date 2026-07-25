import { View } from "react-native";

import { useMerchants } from "@/lib/queries/merchants";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { RoleGate } from "@/components/role-gate";
import { BackBar } from "@/components/back-bar";
import { MerchantsAdmin } from "@/components/merchants-admin";

export default function Merchants() {
  const merchants = useMerchants("pending");

  return (
    <RoleGate role="lgu_admin">
      <Screen
        edges={["top"]}
        refreshing={merchants.isRefetching}
        onRefresh={() => merchants.refetch()}
      >
        <BackBar />

        <View className="gap-0.5">
          <Text className="text-[28px] font-bold leading-tight text-foreground">
            Merchants
          </Text>
        </View>

        <MerchantsAdmin />
      </Screen>
    </RoleGate>
  );
}
