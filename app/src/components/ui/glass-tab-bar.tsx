import { createContext, memo, useContext } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";

export const TAB_BAR_HEIGHT = 66;
export const TAB_BAR_GAP = 12;
export const FLOATING_TAB_BAR_SPACE = TAB_BAR_HEIGHT + TAB_BAR_GAP * 2;

const ICON_SIZE = 40;

/**
 * Our own context rather than BottomTabBarHeightContext: pnpm resolves two
 * copies of @react-navigation/bottom-tabs in this tree, and a context object
 * from the wrong copy would read undefined forever, silently dropping the
 * padding that keeps content clear of the floating bar.
 */
const FloatingTabBarContext = createContext(false);

export function FloatingTabBarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FloatingTabBarContext.Provider value={true}>
      {children}
    </FloatingTabBarContext.Provider>
  );
}

export function useHasFloatingTabBar(): boolean {
  return useContext(FloatingTabBarContext);
}

/**
 * Android's dimezisBlurView captures the surrounding window into its own
 * surface, which cost us square corners and a blue smear bleeding off the
 * active pill. It gets a flat frosted fill instead. Real blur on iOS and web,
 * where it is a native effect and behaves.
 */
const GlassBackground = memo(function GlassBackground() {
  if (Platform.OS === "android") {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(252,253,255,0.94)",
            borderRadius: TAB_BAR_HEIGHT / 2,
          },
        ]}
      />
    );
  }

  return (
    <BlurView
      intensity={85}
      tint="light"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: "rgba(255,255,255,0.32)",
          borderRadius: TAB_BAR_HEIGHT / 2,
        },
      ]}
    />
  );
});

function labelFor(
  tabBarLabel: unknown,
  title: string | undefined,
  routeName: string,
): string {
  switch (true) {
    case typeof tabBarLabel === "string":
      return tabBarLabel;
    case typeof title === "string":
      return title;
    default:
      return routeName;
  }
}

export function GlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: Math.max(insets.bottom, TAB_BAR_GAP),
      }}
    >
      <View
        style={{
          height: TAB_BAR_HEIGHT,
          borderRadius: TAB_BAR_HEIGHT / 2,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: "rgba(11,18,32,0.14)",
          overflow: "hidden",
        }}
      >
        <GlassBackground />

        <View className="flex-1 flex-row items-center px-1.5">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;

            function onPress() {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={() =>
                  navigation.emit({ type: "tabLongPress", target: route.key })
                }
                android_ripple={null}
                className="flex-1 items-center justify-center gap-0.5 active:opacity-70"
              >
                <View
                  style={{
                    height: ICON_SIZE,
                    width: ICON_SIZE,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/*
                    Opacity, never backgroundColor. Toggling a View's colour
                    between a value and transparent makes Android rebuild the
                    background drawable and lose the corner radius, which is
                    what turned this circle into a square on navigation.
                  */}
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: ICON_SIZE / 2,
                      backgroundColor: PH_COLORS.blue,
                      opacity: focused ? 1 : 0,
                    }}
                  />
                  {options.tabBarIcon?.({
                    focused,
                    color: focused ? PH_COLORS.white : PH_COLORS.mutedForeground,
                    size: 20,
                  })}
                </View>
                <Text
                  numberOfLines={1}
                  className={cn(
                    "text-[10px]",
                    focused
                      ? "font-bold text-primary"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  {labelFor(options.tabBarLabel, options.title, route.name)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
