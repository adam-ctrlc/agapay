import { View } from "react-native";
import { CheckCircle, Clock, Storefront } from "phosphor-react-native";

import { useAuth } from "@/lib/auth/context";
import { useLocations } from "@/lib/queries/locations";
import { PH_COLORS } from "@/lib/theme";
import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/list-group";

function Step({
  label,
  hint,
  done,
}: {
  label: string;
  hint: string;
  done: boolean;
}) {
  return (
    <View className="flex-row items-start gap-3 px-4 py-3.5">
      {done ? (
        <CheckCircle size={20} color={PH_COLORS.success} weight="fill" />
      ) : (
        <Clock size={20} color={PH_COLORS.mutedForeground} weight="duotone" />
      )}
      <View className="flex-1">
        <Text className="text-[14px] font-bold text-foreground">{label}</Text>
        <Text className="text-[12px] leading-[17px] text-muted-foreground">
          {hint}
        </Text>
      </View>
    </View>
  );
}

export function PendingApproval() {
  const { user, signOut } = useAuth();
  const locations = useLocations();

  const store =
    (locations.data ?? []).find((l) => l.id === user?.location_id) ?? null;

  return (
    <Screen edges={["top"]}>
      <View className="items-center gap-2 pt-6">
        <View
          className="mb-1 h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: "#fdf1cf" }}
        >
          <Storefront size={46} color="#8a6800" weight="duotone" />
        </View>
        <Text className="text-center text-[22px] font-bold leading-tight text-foreground">
          Waiting for LGU approval
        </Text>
        <Text className="max-w-[300px] text-center text-[13px] leading-[19px] text-muted-foreground">
          Your account is registered. An LGU admin has to approve your store
          before you can redeem vouchers.
        </Text>
      </View>

      <SectionLabel>Where you are</SectionLabel>
      <View className="overflow-hidden rounded-[28px] border border-border bg-card">
        <Step
          label="Account created"
          hint={user?.email ?? "Your details are on file."}
          done
        />
        <View className="h-px bg-border" />
        <Step
          label="Store assigned"
          hint={store?.name ?? "No store linked to this account yet."}
          done={store !== null}
        />
        <View className="h-px bg-border" />
        <Step
          label="LGU approval"
          hint="Your LGU reviews the store, then unlocks redeeming."
          done={false}
        />
      </View>

      <View
        className="gap-1 rounded-3xl p-4"
        style={{ backgroundColor: "#fdf1cf" }}
      >
        <Text className="text-[13px] font-bold text-foreground">
          Nothing to do here yet
        </Text>
        <Text className="text-[12px] leading-[17px] text-muted-foreground">
          You will get a notification the moment your store is approved. Pull
          down or sign in again to check.
        </Text>
      </View>

      <Button variant="outline" label="Sign out" onPress={signOut} />
    </Screen>
  );
}
