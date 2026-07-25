import { useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { Link } from "expo-router";
import {
  ArrowRight,
  MapPin,
  Megaphone,
  Phone,
  Plus,
  Tray,
} from "phosphor-react-native";

import type { IncidentReport } from "@/lib/api/incident-reports";
import { useIncidentReports } from "@/lib/queries/incident-reports";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import { hazardWhen } from "@/components/heatmap/hazard-labels";
import { ReportTracker } from "@/components/reports/report-tracker";
import { ReportThread } from "@/components/reports/report-thread";
import {
  IncidentIcon,
  incidentTint,
} from "@/components/reports/incident-indicators";
import {
  REPORT_TABS,
  countFor,
  matchesTab,
  type ReportTab,
} from "@/components/reports/report-stages";

function statusVariant(report: IncidentReport) {
  switch (report.status) {
    case "verified":
      return "accent" as const;
    case "resolved":
      return "success" as const;
    case "dismissed":
      return "muted" as const;
    default:
      return "secondary" as const;
  }
}

export function ReportCard({ report }: { report: IncidentReport }) {
  const referral = report.referrals?.[0];

  return (
    <View className="gap-3 rounded-[28px] border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: incidentTint(report.type) }}
        >
          <IncidentIcon type={report.type} />
        </View>
        <View className="flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            {report.type_label}
          </Text>
          <Text
            numberOfLines={1}
            className="text-[15px] font-bold leading-tight text-foreground"
          >
            {report.title}
          </Text>
        </View>
        <Badge variant={statusVariant(report)} label={report.status_label} />
      </View>

      <Text numberOfLines={3} className="text-[13px] leading-[19px] text-muted-foreground">
        {report.description}
      </Text>

      {report.photo_thumbnail ? (
        <Image
          source={{ uri: report.photo_thumbnail }}
          className="h-36 w-full rounded-2xl"
          resizeMode="cover"
        />
      ) : null}

      <ReportTracker report={report} />

      {referral ? (
        <View className="gap-1 rounded-2xl border border-border p-3">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Responding agency
          </Text>
          <Text className="text-[14px] font-bold text-foreground">
            {referral.agency_label}
          </Text>
          <Text className="text-[12px] text-muted-foreground">
            {referral.citizen_label}
          </Text>
          {referral.team?.contact_number ? (
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <Phone size={13} color={PH_COLORS.blue} weight="fill" />
              <Text className="text-[12px] font-semibold text-primary">
                {referral.team.contact_number}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <ReportThread reportId={report.id} count={report.comment_count} />

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color={PH_COLORS.mutedForeground} weight="fill" />
          <Text className="text-[11px] text-muted-foreground">
            {report.province ?? report.location_label}
          </Text>
        </View>
        {report.created_at ? (
          <Text className="text-[11px] text-muted-foreground">
            {hazardWhen(report.created_at)}
          </Text>
        ) : null}
        {report.on_impact_map ? (
          <Badge variant="secondary" label="On impact map" />
        ) : null}
      </View>
    </View>
  );
}

function NoReports({ tab }: { tab: ReportTab }) {
  if (tab === "all") {
    return (
      <EmptyState
        icon={Megaphone}
        title="No reports yet"
        description="Anything you report shows up here so you can follow what your LGU does with it."
      />
    );
  }

  return (
    <EmptyState
      icon={Tray}
      title="Nothing in this tab"
      description="You have no reports at this stage. Try another tab to see the rest."
      tint={PH_COLORS.white}
      color={PH_COLORS.mutedForeground}
    />
  );
}

export function MyReports() {
  const reports = useIncidentReports();
  const [tab, setTab] = useState<ReportTab>("all");

  const all = useMemo(() => reports.data ?? [], [reports.data]);

  const options = useMemo<SegmentedOption<ReportTab>[]>(
    () =>
      REPORT_TABS.map((t) => {
        const count = countFor(all, t.key);
        return { key: t.key, label: count > 0 ? `${t.label} ${count}` : t.label };
      }),
    [all],
  );

  const visible = useMemo(
    () => all.filter((r) => matchesTab(r, tab)),
    [all, tab],
  );

  return (
    <View className="gap-4">
      <Link href="/report" asChild>
        <Pressable className="flex-row items-center gap-3 rounded-[28px] border border-primary bg-secondary p-4 active:opacity-80">
          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
            <Plus size={20} color={PH_COLORS.white} weight="bold" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-foreground">
              Report an incident
            </Text>
            <Text className="text-[12px] text-muted-foreground">
              Flooding, fire, blocked roads, downed lines
            </Text>
          </View>
          <ArrowRight size={16} color={PH_COLORS.blue} weight="bold" />
        </Pressable>
      </Link>

      <ChipRow value={tab} onChange={(next) => setTab(next)} options={options} />

      {reports.isLoading ? (
        <View className="gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-[28px]" />
          ))}
        </View>
      ) : visible.length === 0 ? (
        <NoReports tab={tab} />
      ) : (
        <View className="gap-3">
          {visible.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </View>
      )}
    </View>
  );
}
