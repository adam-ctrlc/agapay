import { Tabs } from "expo-router";
import {
  House,
  MapPin,
  MapTrifold,
  Megaphone,
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

export default function CitizenLayout() {
  return (
    <RoleGate role="citizen">
      <FloatingTabBarProvider>
        <Tabs
          tabBar={(props) => <GlassTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen
            name="index"
            options={{ tabBarLabel: "Home", tabBarIcon: tabIcon(House) }}
          />
          <Tabs.Screen
            name="locations"
            options={{ tabBarLabel: "Relief", tabBarIcon: tabIcon(MapPin) }}
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
