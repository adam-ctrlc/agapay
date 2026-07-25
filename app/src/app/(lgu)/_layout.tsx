import { Tabs } from "expo-router";
import {
  BookOpen,
  ChartBar,
  Lightning,
  Megaphone,
  Tag,
  User,
  type IconProps,
} from "phosphor-react-native";

import { RoleGate } from "@/components/role-gate";
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

export default function LguLayout() {
  return (
    <RoleGate role="lgu_admin">
      <FloatingTabBarProvider>
        <Tabs
          tabBar={(props) => <GlassTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen
            name="index"
            options={{ tabBarLabel: "Home", tabBarIcon: tabIcon(ChartBar) }}
          />
          <Tabs.Screen
            name="announcements"
            options={{ tabBarLabel: "Alerts", tabBarIcon: tabIcon(Megaphone) }}
          />
          <Tabs.Screen
            name="prices"
            options={{ tabBarLabel: "Prices", tabBarIcon: tabIcon(Tag) }}
          />
          <Tabs.Screen
            name="guides"
            options={{ tabBarLabel: "Gabay", tabBarIcon: tabIcon(BookOpen) }}
          />
          <Tabs.Screen
            name="hazards"
            options={{ tabBarLabel: "Risk", tabBarIcon: tabIcon(Lightning) }}
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
