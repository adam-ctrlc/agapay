import { useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import {
  CaretRight,
  MapPin,
  Megaphone,
  Trash,
  Tray,
  User,
} from "phosphor-react-native";

import { ApiError } from "@/lib/api/client";
import type {
  IncidentReport,
  Referral,
  ReferralStatus,
  ReportStatus,
} from "@/lib/api/incident-reports";
import {
  useAdvanceReferral,
  useDeleteIncidentReport,
  useIncidentReports,
  usePromoteIncidentReport,
  useReviewIncidentReport,
} from "@/lib/queries/incident-reports";
import { PH_COLORS } from "@/lib/theme";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDialog } from "@/components/ui/dialog";
import { ChipRow, type SegmentedOption } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/list-group";
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

function nextStatus(status: ReferralStatus): ReferralStatus | null {
  switch (status) {
    case "suggested":
      return "referred";
    case "referred":
      return "acknowledged";
    case "acknowledged":
      return "closed";
    case "closed":
      return null;
  }
}

function nextLabel(status: ReferralStatus): string {
  switch (status) {
    case "suggested":
      return "Send to agency";
    case "referred":
      return "Mark acknowledged";
    case "acknowledged":
      return "Close referral";
    case "closed":
      return "Closed";
  }
}

function ReferralRow({ referral }: { referral: Referral }) {
  const advance = useAdvanceReferral();
  const dialog = useDialog();
  const next = nextStatus(referral.status);

  return (
    <View className="gap-2 rounded-2xl border border-border p-3">
      <View className="flex-row items-center gap-2">
        <Text className="flex-1 text-[14px] font-bold text-foreground">
          {referral.agency_label}
        </Text>
        <Badge
          variant={referral.status === "closed" ? "muted" : "accent"}
          label={referral.status_label}
        />
      </View>

      <Text className="text-[12px] text-muted-foreground">
        {referral.team
          ? `${referral.team.name}${referral.team.contact_number ? ` · ${referral.team.contact_number}` : ""}`
          : "No team on file for this agency yet."}
      </Text>

      {next ? (
        <Button
          size="sm"
          variant="secondary"
          label={nextLabel(referral.status)}
          loading={advance.isPending}
          onPress={() =>
            advance.mutate(
              { id: referral.id, status: next },
              {
                onError: (e) =>
                  dialog.alert({
                    title: "Could not update",
                    message:
                      e instanceof ApiError ? e.message : "Please try again.",
                  }),
              },
            )
          }
        />
      ) : null}
    </View>
  );
}

function ReportRow({ report }: { report: IncidentReport }) {
  const review = useReviewIncidentReport();
  const promote = usePromoteIncidentReport();
  const remove = useDeleteIncidentReport();
  const dialog = useDialog();
  const [open, setOpen] = useState(false);

  function setStatus(status: ReportStatus) {
    review.mutate(
      { id: report.id, status },
      {
        onError: (e) =>
          dialog.alert({
            title: "Could not update",
            message: e instanceof ApiError ? e.message : "Please try again.",
          }),
      },
    );
  }

  return (
    <View className="gap-3 rounded-[28px] border border-border bg-card p-4">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        android_ripple={null}
        className="flex-row items-center gap-3 active:opacity-70"
      >
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
        <Badge
          variant={report.status === "submitted" ? "secondary" : "muted"}
          label={report.status_label}
        />
        <View style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}>
          <CaretRight size={16} color={PH_COLORS.mutedForeground} />
        </View>
      </Pressable>

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
        <View className="flex-row items-center gap-1">
          <User size={12} color={PH_COLORS.mutedForeground} weight="fill" />
          <Text className="text-[11px] text-muted-foreground">
            {report.reporter ?? "Unknown reporter"}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color={PH_COLORS.mutedForeground} weight="fill" />
          <Text className="text-[11px] text-muted-foreground">
            {report.location_label}
            {report.accuracy_meters != null
              ? ` (±${report.accuracy_meters}m)`
              : ""}
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
        {report.comment_count > 0 ? (
          <Badge
            variant="accent"
            label={`${report.comment_count} message${report.comment_count > 1 ? "s" : ""}`}
          />
        ) : null}
      </View>

      {open ? (
        <>
          <Text className="text-[13px] leading-[19px] text-muted-foreground">
            {report.description}
          </Text>

          {report.photo_thumbnail ? (
            <Image
              source={{ uri: report.photo_thumbnail }}
              className="h-36 w-full rounded-2xl"
              resizeMode="cover"
            />
          ) : report.has_photo ? (
            <Badge variant="muted" label="Photo attached" />
          ) : null}

          <ReportTracker report={report} />

          {report.status === "submitted" ? (
            <View className="flex-row gap-2">
              <Button
                className="flex-1"
                size="sm"
                label="Verify"
                loading={review.isPending}
                onPress={() => setStatus("verified")}
              />
              <Button
                className="flex-1"
                size="sm"
                variant="outline"
                label="Dismiss"
                loading={review.isPending}
                onPress={() => setStatus("dismissed")}
              />
            </View>
          ) : null}

          {report.status === "verified" ? (
            <Button
              size="sm"
              variant="secondary"
              label="Mark resolved"
              loading={review.isPending}
              onPress={() => setStatus("resolved")}
            />
          ) : null}

          {report.status !== "dismissed" && !report.on_impact_map ? (
            <Button
              size="sm"
              variant="outline"
              label="Publish to impact map"
              loading={promote.isPending}
              onPress={() =>
                promote.mutate(report.id, {
                  onSuccess: () =>
                    dialog.alert({
                      title: "Published",
                      message: "This now shades the public impact map.",
                    }),
                  onError: (e) =>
                    dialog.alert({
                      title: "Could not publish",
                      message:
                        e instanceof ApiError ? e.message : "Please try again.",
                    }),
                })
              }
            />
          ) : null}

          {(report.referrals ?? []).map((referral) => (
            <ReferralRow key={referral.id} referral={referral} />
          ))}

          <ReportThread reportId={report.id} count={report.comment_count} />

          <Pressable
            hitSlop={8}
            android_ripple={null}
            className="flex-row items-center justify-center gap-1.5 py-1 active:opacity-60"
            onPress={async () => {
              const ok = await dialog.confirm({
                title: "Remove this report?",
                message: "The reporter will no longer see it.",
                confirmLabel: "Remove",
                destructive: true,
              });

              if (ok) remove.mutate(report.id);
            }}
          >
            <Trash size={14} color={PH_COLORS.red} />
            <Text className="text-[12px] font-semibold text-destructive">
              Remove report
            </Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

export function ReportsAdmin() {
  const reports = useIncidentReports();
  const [tab, setTab] = useState<ReportTab>("submitted");

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
    <>
      <Text className="text-[13px] leading-[19px] text-muted-foreground">
        Verify a report to publish it to the public impact map, then move its
        referral along as the agency responds. The reporter sees each step.
      </Text>

      <ChipRow value={tab} onChange={(next) => setTab(next)} options={options} />

      <SectionLabel>
        {visible.length === 1 ? "1 report" : `${visible.length} reports`}
      </SectionLabel>

      {reports.isLoading ? (
        <View className="gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-[28px]" />
          ))}
        </View>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={tab === "all" ? Megaphone : Tray}
          title={tab === "all" ? "No reports yet" : "Nothing in this tab"}
          description={
            tab === "all"
              ? "Citizen reports land here the moment they are sent."
              : "No reports are at this stage right now. Try another tab."
          }
          tint={tab === "all" ? "#e8effb" : PH_COLORS.white}
          color={tab === "all" ? PH_COLORS.blue : PH_COLORS.mutedForeground}
        />
      ) : (
        <View className="gap-3">
          {visible.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </View>
      )}
    </>
  );
}
