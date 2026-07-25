import type { IncidentReport, ReportStatus } from "@/lib/api/incident-reports";

export type StageState = "done" | "current" | "pending";

export type ReportStage = {
  key: string;
  label: string;
  state: StageState;
};

export type ReportTab = ReportStatus | "all";

export const REPORT_TABS: { key: ReportTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Under review" },
  { key: "verified", label: "In progress" },
  { key: "resolved", label: "Resolved" },
  { key: "dismissed", label: "Dismissed" },
];

export function matchesTab(report: IncidentReport, tab: ReportTab): boolean {
  return tab === "all" || report.status === tab;
}

export function countFor(reports: IncidentReport[], tab: ReportTab): number {
  return tab === "all"
    ? reports.length
    : reports.filter((r) => r.status === tab).length;
}

function wasReferred(report: IncidentReport): boolean {
  return (report.referrals ?? []).some((r) => {
    switch (r.status) {
      case "referred":
      case "acknowledged":
      case "closed":
        return true;
      default:
        return false;
    }
  });
}

function wasAcknowledged(report: IncidentReport): boolean {
  return (report.referrals ?? []).some((r) => {
    switch (r.status) {
      case "acknowledged":
      case "closed":
        return true;
      default:
        return false;
    }
  });
}

/**
 * Every stage reflects a transition an admin actually recorded. Nothing here
 * advances on a timer, so the tracker cannot claim a response that did not
 * happen.
 */
export function reportStages(report: IncidentReport): ReportStage[] {
  const reviewed = report.status === "verified" || report.status === "resolved";
  const referred = wasReferred(report);
  const resolved = report.status === "resolved";

  const state = (done: boolean, active: boolean): StageState => {
    switch (true) {
      case done:
        return "done";
      case active:
        return "current";
      default:
        return "pending";
    }
  };

  return [
    { key: "submitted", label: "Submitted", state: "done" },
    { key: "reviewed", label: "Reviewed", state: state(reviewed, !reviewed) },
    {
      key: "referred",
      label: "Referred",
      state: state(referred, reviewed && !referred),
    },
    {
      key: "resolved",
      label: "Resolved",
      state: state(resolved, referred && !resolved),
    },
  ];
}

export function isDismissed(report: IncidentReport): boolean {
  return report.status === "dismissed";
}

export function currentHint(report: IncidentReport): string {
  switch (report.status) {
    case "dismissed":
      return "Your LGU reviewed this and did not take it forward.";
    case "resolved":
      return "This has been marked resolved by your LGU.";
    case "submitted":
      return "Your LGU has received this and is reviewing it.";
    default:
      break;
  }

  switch (true) {
    case wasAcknowledged(report):
      return "The agency confirmed it received this report.";
    case wasReferred(report):
      return "Your LGU sent this to the responding agency.";
    default:
      return "Verified by your LGU. Being matched to an agency.";
  }
}
