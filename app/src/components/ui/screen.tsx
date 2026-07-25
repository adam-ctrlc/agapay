import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import {
  SafeAreaView,
  type Edge,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import {
  FLOATING_TAB_BAR_SPACE,
  useHasFloatingTabBar,
} from "@/components/ui/glass-tab-bar";

type ScreenScroll = { scrollToTop: () => void };

const ScreenScrollContext = createContext<ScreenScroll>({
  scrollToTop: () => {},
});

/**
 * Lets deeply nested content scroll its own screen without prop drilling a ref.
 * Admin lists use it to jump back to the form when you tap Edit.
 */
export function useScreenScroll(): ScreenScroll {
  return useContext(ScreenScrollContext);
}

export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  edges = ["top"],
  className,
  scrollRef,
  scrollEnabled = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  className?: string;
  scrollRef?: React.Ref<ScrollView>;
  scrollEnabled?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const innerRef = useRef<ScrollView | null>(null);

  const setRef = useCallback(
    (node: ScrollView | null) => {
      innerRef.current = node;

      switch (typeof scrollRef) {
        case "function":
          scrollRef(node);
          break;
        case "object":
          if (scrollRef !== null) {
            (scrollRef as React.MutableRefObject<ScrollView | null>).current =
              node;
          }
          break;
        default:
          break;
      }
    },
    [scrollRef],
  );

  const scrollValue = useMemo<ScreenScroll>(
    () => ({
      /**
       * Jumps rather than animates. Android aborts an in-flight smooth scroll
       * when the content resizes under it, which a form filling in reliably
       * does, so the animated version kept stopping partway.
       *
       * Re-issued because a single frame is not enough: callers set state in
       * the same tick, and the form growing as it fills re-lays out the
       * content after the first attempt has already run. Jumping to the top
       * is idempotent, so repeating it just holds the position.
       */
      scrollToTop: () => {
        const run = () => innerRef.current?.scrollTo({ y: 0, animated: false });

        requestAnimationFrame(run);

        for (const delay of [50, 150, 350]) {
          setTimeout(run, delay);
        }
      },
    }),
    [],
  );

  /**
   * The floating tab bar is absolutely positioned, so content scrolls
   * underneath it and has to reserve the space itself. Pushed routes live
   * outside the tab navigator and get nothing.
   */
  const insideTabs = useHasFloatingTabBar();
  const bottomInset = edges.includes("bottom") ? 0 : insets.bottom;
  const bottomSpace = insideTabs
    ? FLOATING_TAB_BAR_SPACE + insets.bottom
    : bottomInset;

  return (
    <ScreenScrollContext.Provider value={scrollValue}>
      <SafeAreaView edges={edges} className="flex-1 bg-background">
        {scroll ? (
          <ScrollView
            ref={setRef}
            scrollEnabled={scrollEnabled}
            className="flex-1"
            contentContainerClassName={cn("gap-4", className)}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 16 + bottomSpace,
            }}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={!!refreshing}
                  onRefresh={onRefresh}
                  tintColor={PH_COLORS.blue}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View
            className={cn("flex-1 gap-4", className)}
            style={{ padding: 16, paddingBottom: 16 + bottomSpace }}
          >
            {children}
          </View>
        )}
      </SafeAreaView>
    </ScreenScrollContext.Provider>
  );
}
