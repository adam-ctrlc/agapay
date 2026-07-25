import { View } from "react-native";
import { Check, XCircle } from "phosphor-react-native";

import { cn } from "@/lib/utils";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import type { IncidentReport } from "@/lib/api/incident-reports";
import {
  currentHint,
  isDismissed,
  reportStages,
  type StageState,
} from "@/components/reports/report-stages";

function Dot({ state }: { state: StageState }) {
  switch (state) {
    case "done":
      return (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Check size={13} color={PH_COLORS.white} weight="bold" />
        </View>
      );
    case "current":
      return (
        <View className="h-6 w-6 items-center justify-center rounded-full border-[3px] border-primary bg-background">
          <View className="h-2 w-2 rounded-full bg-primary" />
        </View>
      );
    default:
      return (
        <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-muted" />
      );
  }
}

export function ReportTracker({ report }: { report: IncidentReport }) {
  if (isDismissed(report)) {
    return (
      <View
        className="flex-row items-center gap-3 rounded-2xl p-3.5"
        style={{ backgroundColor: "#f2f4f7" }}
      >
        <XCircle size={22} color={PH_COLORS.mutedForeground} weight="fill" />
        <Text className="flex-1 text-[12px] text-muted-foreground">
          {currentHint(report)}
        </Text>
      </View>
    );
  }

  const stages = reportStages(report);
  const last = stages.length - 1;

  return (
    <View className="gap-3 rounded-2xl bg-muted p-3.5">
      <View className="flex-row">
        {stages.map((stage, i) => {
          const filled = stage.state === "done";
          const nextFilled = i < last && stages[i + 1].state !== "pending";

          return (
            <View key={stage.key} className="flex-1 items-center gap-1.5">
              <View className="w-full flex-row items-center">
                <View
                  className={cn(
                    "h-0.5 flex-1",
                    i === 0
                      ? "bg-transparent"
                      : filled || stage.state === "current"
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
                <Dot state={stage.state} />
                <View
                  className={cn(
                    "h-0.5 flex-1",
                    i === last
                      ? "bg-transparent"
                      : nextFilled
                        ? "bg-primary"
                        : "bg-border",
                  )}
                />
              </View>
              <Text
                numberOfLines={1}
                className={cn(
                  "text-[10px]",
                  stage.state === "pending"
                    ? "font-medium text-muted-foreground"
                    : "font-bold text-foreground",
                )}
              >
                {stage.label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text className="text-[12px] leading-[17px] text-muted-foreground">
        {currentHint(report)}
      </Text>
    </View>
  );
}
