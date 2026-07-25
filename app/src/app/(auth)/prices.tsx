import { View } from "react-native";

import { Screen } from "@/components/ui/screen";
import { Text } from "@/components/ui/text";
import { TextLink } from "@/components/ui/text-link";
import { BackBar } from "@/components/back-bar";
import { PriceList } from "@/components/price-list";

export default function PublicPrices() {
  return (
    <Screen>
      <BackBar />

      <View className="gap-0.5 pt-1">
        <Text className="text-[28px] font-bold leading-tight text-foreground">
          Price Watch
        </Text>
        <Text className="text-[13px] text-muted-foreground">
          Current fuel, fare, and market prices across the Philippines.
        </Text>
      </View>

      <PriceList />

      <View className="items-center py-1">
        <TextLink href="/(auth)/login">Back to sign in</TextLink>
      </View>
    </Screen>
  );
}
