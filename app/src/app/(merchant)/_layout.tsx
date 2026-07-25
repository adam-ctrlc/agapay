import { Tabs } from "expo-router";
import {
  CloudArrowUp,
  MapTrifold,
  Megaphone,
  QrCode,
  User,
  type IconProps,
} from "phosphor-react-native";

import { RoleGate } from "@/components/role-gate";
import { useAuth } from "@/lib/auth/context";
import { useVoucherKey } from "@/lib/queries/voucher-key";
import { PendingApproval } from "@/components/merchant/pending-approval";
import {
  FloatingTabBarProvider,
  GlassTabBar,
} from "@/components/ui/glass-tab-bar";

type TabIcon = React.ComponentType<IconProps>;

function tabIcon(Icon: TabIcon) {
  return function renderIcon({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: string;
    size: number;
  }) {
    return (
      <Icon color={color} size={size} weight={focused ? "fill" : "regular"} />
    );
  };
}

export default function MerchantLayout() {
  const { user } = useAuth();

  useVoucherKey();

  /**
   * Signing in still works while waiting, so the merchant can see where their
   * application stands. The tabs only appear once an LGU has approved the
   * store, which matches what the API will actually allow.
   */
  if (user?.is_approved === false) {
    return (
      <RoleGate role="merchant">
        <PendingApproval />
      </RoleGate>
    );
  }

  return (
    <RoleGate role="merchant">
      <FloatingTabBarProvider>
        <Tabs
          tabBar={(props) => <GlassTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen
            name="index"
            options={{ tabBarLabel: "Redeem", tabBarIcon: tabIcon(QrCode) }}
          />
          <Tabs.Screen
            name="offline"
            options={{
              tabBarLabel: "Offline",
              tabBarIcon: tabIcon(CloudArrowUp),
            }}
          />
          <Tabs.Screen
            name="impact"
            options={{ tabBarLabel: "Impact", tabBarIcon: tabIcon(MapTrifold) }}
          />
          <Tabs.Screen
            name="announcements"
            options={{ tabBarLabel: "Alerts", tabBarIcon: tabIcon(Megaphone) }}
          />
          <Tabs.Screen
            name="account"
            options={{ tabBarLabel: "Account", tabBarIcon: tabIcon(User) }}
          />
        </Tabs>
      </FloatingTabBarProvider>
    </RoleGate>
  );
}
