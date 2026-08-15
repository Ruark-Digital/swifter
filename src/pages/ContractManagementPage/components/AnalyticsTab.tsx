import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Share2, FileText, Shield, AlertTriangle, FileCheck, DollarSign } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import type { ContractDetail } from "@/types";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";
import {
  buildPendingApprovalLine,
  buildRfiAlertLine,
  isApprovalDelayed,
  type PendingApproval,
  type RfiAlert,
} from "../lib/contractAlerts";

type DashboardTier = "high" | "medium" | "good" | "critical" | "low" | string;

type DashboardOverview = {
  riskScore?: { score?: number; tier?: DashboardTier };
  compliance?: { score?: number; tier?: DashboardTier };
  rating?: { score?: number; tier?: DashboardTier };
  budget?: { score?: number | string; tier?: DashboardTier };
  kpi?: { score?: number; tier?: DashboardTier };
};

type FinancialStatement = {
  originalContractValue?: number;
  changeOrders?: { count?: number; value?: number };
  pendingChangeOrders?: number | { count?: number; value?: number };
  savingsRealized?: { value?: number; percentage?: number };
  percentageIncrease?: number;
  percentIncreaseFromOriginal?: number;
  holdbackAmount?: number;
  releasedHoldback?: number;
  currentContractValue?: number;
  billedTillDate?: number;
  remaining?: number;
  currency?: string;
};

type DeliverableStatus = {
  total?: number;
  approved?: number;
  rejected?: number;
  pending?: number;
};

type ActivitiesData = {
  current?: {
    range?: string | number;
    labels?: string[];
    series?: {
      change?: number[];
      claims?: number[];
      invoice?: number[];
      rfi?: number[];
      ncr?: number[];
      deliverables?: number[];
    };
  };
  previous?: {
    range?: string | number;
    labels?: string[];
    series?: {
      change?: number[];
      claims?: number[];
      invoice?: number[];
      rfi?: number[];
      ncr?: number[];
      deliverables?: number[];
    };
  };
};

type DeliverySummaryData = {
  summary?: {
    total?: number;
    onTime?: number;
    rejected?: number;
    /** Backend v2.3.0 field name — was previously typed as `lateMissed`,
     *  which never matched the payload so the "Late" tile always rendered 0. */
    late?: number;
  };
};

type AttachmentSummary = { amendment?: number; policy?: number };

type AlertsData = {
  generatedAt?: string;
  summary?: {
    scannedContracts?: number;
    contractsRequiringAttention?: number;
    totalOverdueItems?: number;
    totalInsuranceWarnings?: number;
    totalErrors?: number;
  };
  contracts?: Array<{
    contractRef?: string;
    contractCode?: string;
    contractTitle?: string;
    contractType?: string;
    /** Swagger/prod shape: pre-formatted action strings. */
    recommendedActions?: string[];
    overdueItems?: Array<{
      entity?: string;
      id?: string;
      daysOpen?: number;
      pendingWith?: string;
    }>;
    /** Live "bug" backend shape: alerts split across typed fields instead of
     *  a single recommendedActions[]. */
    kpiAlert?: { message?: string } | null;
    expiryAlert?: { message?: string } | string | null;
    insuranceWarnings?: Array<{
      category?: string;
      label?: string;
      daysToExpiry?: number;
    }>;
    deliverableAlerts?: {
      upcoming?: unknown[];
      late?: unknown[];
      missed?: unknown[];
    } | null;
    rfiAlerts?: RfiAlert[];
    ncrAlerts?: unknown[];
    pendingApprovals?: PendingApproval[];
  }>;
};

type ClauseLegalAnalysisData = {
  clauses?: Array<{
    title?: string;
    standard?: string;
    actual?: string;
    risk?: string;
    order?: number;
  }>;
};

type VendorKpiData = Array<{ score?: number }>;
type AnalyticsRange = "YTD" | 90 | 60 | 7;

export const ACTIVITY_SERIES = [
  { key: "change", name: "Changes", stroke: "#3B82F6", legendClassName: "bg-blue-500" },
  { key: "claims", name: "Claims", stroke: "#10B981", legendClassName: "bg-green-500" },
  { key: "invoice", name: "Invoices", stroke: "#F59E0B", legendClassName: "bg-yellow-500" },
  { key: "rfi", name: "RFI", stroke: "#6366F1", legendClassName: "bg-indigo-500" },
  { key: "ncr", name: "NCR", stroke: "#EF4444", legendClassName: "bg-red-500" },
  { key: "deliverables", name: "Deliverables", stroke: "#A855F7", legendClassName: "bg-purple-500" },
] as const;

type Props = {
  contract?: ContractDetail;
  overview?: DashboardOverview;
  financialStatement?: FinancialStatement;
  deliverableStatus?: DeliverableStatus;
  activities?: ActivitiesData;
  activitiesRange?: AnalyticsRange;
  onActivitiesRangeChange?: (range: AnalyticsRange) => void;
  deliverySummary?: DeliverySummaryData;
  deliverySummaryRange?: AnalyticsRange;
  onDeliverySummaryRangeChange?: (range: AnalyticsRange) => void;
  attachments?: AttachmentSummary;
  alerts?: AlertsData;
  clauseLegalAnalysis?: ClauseLegalAnalysisData;
  vendorKpi?: VendorKpiData;
};

const toTitleCase = (value: string) => {
  const v = value.trim();
  if (!v) return v;
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
};

const tierToColor = (tier?: DashboardTier) => {
  const t = (tier ?? "").toLowerCase();
  if (t === "high" || t === "critical") return "#EF4444";
  if (t === "medium") return "#F59E0B";
  if (t === "good" || t === "low") return "#10B981";
  return "#64748B";
};

const tierToBadge = (tier?: DashboardTier) => {
  const t = (tier ?? "").toLowerCase();
  if (t === "high" || t === "critical")
    return "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (t === "medium")
    return "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300";
};

const formatNumber = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value;
};

const formatPercent = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${Math.round(value)}%`;
};

const formatMoney = (value?: number, currency?: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatIsoDate = (value?: string) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return d.toISOString().slice(0, 10);
};

const average = (values: number[]) => {
  if (!values.length) return undefined;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const avg = sum / values.length;
  if (!Number.isFinite(avg)) return undefined;
  return avg;
};

const AnalyticsTab: React.FC<Props> = ({
  contract,
  overview,
  financialStatement,
  deliverableStatus,
  activities,
  activitiesRange = "YTD",
  onActivitiesRangeChange,
  deliverySummary,
  deliverySummaryRange = "YTD",
  onDeliverySummaryRangeChange,
  attachments,
  alerts,
  clauseLegalAnalysis,
  vendorKpi,
}) => {
  const activitiesRanges: Array<{ label: string; value: AnalyticsRange }> = [
    { label: "YTD", value: "YTD" },
    { label: "90 days", value: 90 },
    { label: "60 days", value: 60 },
    { label: "7 days", value: 7 },
  ];

  const deliverySummaryRanges: Array<{ label: string; value: AnalyticsRange }> =
    [
      { label: "YTD", value: "YTD" },
      { label: "90 days", value: 90 },
      { label: "60 days", value: 60 },
      { label: "7 days", value: 7 },
    ];

  const kpiCards = [
    {
      label: "Risk Score",
      value: overview?.riskScore?.score,
      tier: overview?.riskScore?.tier,
      displayType: "percentage" as const,
      maxValue: 100,
    },
    {
      label: "Compliance Status",
      value: overview?.compliance?.score,
      tier: overview?.compliance?.tier,
      displayType: "percentage" as const,
      maxValue: 100,
    },
    {
      label: "Complexity Rating",
      value: overview?.rating?.score,
      tier: overview?.rating?.tier,
      displayType: "score" as const,
      maxValue: 10,
    },
    {
      label: "Budget Status",
      value: overview?.budget?.score,
      tier: overview?.budget?.tier,
      // budget.score is a 0-100 percentage (e.g. "23.99"), not a /10 score —
      // render it as a percentage like SLA Performance.
      displayType: "percentage" as const,
      maxValue: 100,
    },
    {
      label: "SLA Performance",
      value: overview?.kpi?.score,
      tier: overview?.kpi?.tier,
      displayType: "percentage" as const,
      maxValue: 100,
    },
  ];

  const financialRows = [
    {
      label: "Original Contract Value",
      value: formatMoney(
        financialStatement?.originalContractValue,
        financialStatement?.currency,
      ),
    },
    {
      label: `Change Orders (${formatNumber(financialStatement?.changeOrders?.count)})`,
      value:
        typeof financialStatement?.changeOrders?.value === "number"
          ? `+${formatMoney(financialStatement?.changeOrders?.value, financialStatement?.currency)}`
          : "--",
      color: "text-red-500",
    },
    (() => {
      const pco = financialStatement?.pendingChangeOrders;
      const pcoCount = typeof pco === "object" && pco !== null ? pco.count : undefined;
      const pcoValue =
        typeof pco === "object" && pco !== null ? pco.value : pco;
      return {
        label:
          typeof pcoCount === "number"
            ? `Pending Change Orders (${pcoCount})`
            : "Pending Change Orders",
        value:
          typeof pcoValue === "number"
            ? formatMoney(pcoValue, financialStatement?.currency)
            : "--",
        color: "text-yellow-500",
      };
    })(),
    {
      label: "Savings Realized",
      value:
        typeof financialStatement?.savingsRealized?.value === "number"
          ? `${formatMoney(financialStatement?.savingsRealized?.value, financialStatement?.currency)}(${formatPercent(financialStatement?.savingsRealized?.percentage)})`
          : "--",
      color: "text-slate-700 dark:text-slate-300",
    },
    (() => {
      const pct =
        financialStatement?.percentIncreaseFromOriginal ??
        financialStatement?.percentageIncrease;
      return {
        label: "% Increase from Original",
        value: typeof pct === "number" ? `+${formatPercent(pct)}` : "--",
        color: "text-red-500",
      };
    })(),
    {
      label: "Holdback Amount",
      value: formatMoney(
        financialStatement?.holdbackAmount,
        financialStatement?.currency,
      ),
      color: "text-purple-600",
    },
  ];

  // The BE returns two divergent per-contract alert shapes: the swagger/prod
  // shape ships a ready-made `recommendedActions: string[]`, while the live
  // "bug" backend splits the same information across typed fields
  // (kpiAlert, insuranceWarnings, deliverableAlerts, rfi/ncr/pendingApprovals,
  // expiryAlert). Prefer recommendedActions when present, otherwise synthesize
  // the lines so the card isn't blank when only the drifted shape arrives.
  const alertsRows = (() => {
    const c = alerts?.contracts?.[0];
    if (!c) return [];

    if (c.recommendedActions?.length) {
      return c.recommendedActions.map((text) => ({ text, urgent: true }));
    }

    const lines: string[] = [];
    const push = (value?: string | null) => {
      if (typeof value === "string" && value.trim()) lines.push(value.trim());
    };
    const count = (arr?: unknown[]) => (Array.isArray(arr) ? arr.length : 0);

    push(c.kpiAlert?.message);
    push(typeof c.expiryAlert === "string" ? c.expiryAlert : c.expiryAlert?.message);

    (c.insuranceWarnings ?? []).forEach((w) => {
      const label = (w.label ?? w.category ?? "policy").replace(/_/g, " ");
      const days =
        typeof w.daysToExpiry === "number" ? ` (expires in ${w.daysToExpiry} days)` : "";
      push(`Insurance warning: ${label}${days}`);
    });

    const late = count(c.deliverableAlerts?.late);
    const missed = count(c.deliverableAlerts?.missed);
    const upcoming = count(c.deliverableAlerts?.upcoming);
    if (late) push(`${late} late deliverable${late > 1 ? "s" : ""} require attention`);
    if (missed) push(`${missed} missed deliverable${missed > 1 ? "s" : ""}`);
    if (upcoming) push(`${upcoming} upcoming deliverable${upcoming > 1 ? "s" : ""} due soon`);

    // #141 — expand RFI + pending-approval alerts into one detailed line each
    // (replacing the old aggregate "N items pending approval"). Approvals are
    // gated to items delayed 24h+; the line uses the `pendingWith` role until
    // the BE populates responsibleUsers with names.
    const alertsCurrency =
      financialStatement?.currency ?? (contract as any)?.currency;
    (c.rfiAlerts ?? []).forEach((r) => push(buildRfiAlertLine(r)));
    const ncr = count(c.ncrAlerts);
    if (ncr) push(`${ncr} NCR${ncr > 1 ? "s" : ""} require action`);
    (c.pendingApprovals ?? [])
      .filter(isApprovalDelayed)
      .forEach((a) =>
        push(buildPendingApprovalLine(a, (amount) => formatMoney(amount, alertsCurrency))),
      );

    (c.overdueItems ?? []).forEach((o) => {
      push(
        `Follow up on ${o.entity ?? "item"} ${o.id ?? ""} (${o.daysOpen ?? "?"} days overdue)`
          .replace(/\s+/g, " ")
          .trim(),
      );
    });

    return lines.map((text) => ({ text, urgent: true }));
  })();

  const clauseRows =
    clauseLegalAnalysis?.clauses?.length
      ? clauseLegalAnalysis.clauses
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((c) => {
            const risk = (c.risk ?? "").toLowerCase();
            const color = risk === "high" ? "red" : risk === "low" ? "green" : "yellow";
            const status =
              risk === "high"
                ? "HIGH RISK"
                : risk === "low"
                  ? "LOW RISK"
                  : "MEDIUM RISK";
            return {
              title: c.title ?? "--",
              status,
              color,
              desc: `Standard: ${c.standard ?? "--"}`,
              actual: `Actual: ${c.actual ?? "--"}`,
            };
          })
      : [];

  const deliverableChartData = [
    {
      name: "Approved",
      value: formatNumber(deliverableStatus?.approved),
      color: "#1E293B",
    },
    {
      name: "Rejected",
      value: formatNumber(deliverableStatus?.rejected),
      color: "#EF4444",
    },
    {
      name: "Pending",
      value: formatNumber(deliverableStatus?.pending),
      color: "#F59E0B",
    },
  ];

  const labels = activities?.current?.labels ?? [];
  const series = activities?.current?.series;
  // Aggregate by month to avoid duplicate X-axis labels when API returns weekly data
  const activityChartData = (() => {
    const monthMap = new Map<string, {
      change: number; claims: number; invoice: number; rfi: number; ncr: number; deliverables: number;
    }>();
    // Preserve insertion order for correct month ordering
    labels.forEach((label, idx) => {
      const d = new Date(label);
      const monthKey = Number.isNaN(d.getTime())
        ? String(label)
        : new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
      const existing = monthMap.get(monthKey) ?? { change: 0, claims: 0, invoice: 0, rfi: 0, ncr: 0, deliverables: 0 };
      monthMap.set(monthKey, {
        change: existing.change + (series?.change?.[idx] ?? 0),
        claims: existing.claims + (series?.claims?.[idx] ?? 0),
        invoice: existing.invoice + (series?.invoice?.[idx] ?? 0),
        rfi: existing.rfi + (series?.rfi?.[idx] ?? 0),
        ncr: existing.ncr + (series?.ncr?.[idx] ?? 0),
        deliverables: existing.deliverables + (series?.deliverables?.[idx] ?? 0),
      });
    });
    return Array.from(monthMap.entries()).map(([day, values]) => ({ day, ...values }));
  })();

  const deliverySummaryTotals = {
    total: formatNumber(deliverySummary?.summary?.total),
    onTime: formatNumber(deliverySummary?.summary?.onTime),
    rejected: formatNumber(deliverySummary?.summary?.rejected),
    lateMissed: formatNumber(deliverySummary?.summary?.late),
  };

  const vendorScores = (vendorKpi ?? [])
    .map((v) => v.score)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const vendorAvg = average(vendorScores);
  const vendorAvgPercent =
    typeof vendorAvg === "number" ? Math.round(vendorAvg) : undefined;

  const contractStatus = contract?.status ? toTitleCase(contract.status) : "--";
  const contractOwner =
    typeof (contract as any)?.creator === "string"
      ? (contract as any).creator
      : typeof (contract as any)?.creator?.name === "string"
        ? (contract as any).creator.name
        : "--";

  const contractVendor =
    typeof (contract as any)?.vendor === "string"
      ? (contract as any).vendor
      : typeof (contract as any)?.vendor?.name === "string"
        ? (contract as any).vendor.name
        : "--";

  const contractValue =
    typeof financialStatement?.currentContractValue === "number"
      ? formatMoney(financialStatement.currentContractValue, financialStatement.currency)
      : typeof (contract as any)?.totalAmount === "number"
        ? formatMoney((contract as any).totalAmount, (contract as any).currency)
        : "--";

  const originalValue =
    typeof financialStatement?.originalContractValue === "number"
      ? formatMoney(financialStatement.originalContractValue, financialStatement.currency)
      : "--";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Analytics</h3>
        <ExportReportSheet contractId={contract?._id ?? ""} contractType="Contract">
          <Button variant="outline" className="text-slate-600 dark:text-slate-400 dark:text-slate-500 border-slate-300">
            <Share2 className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </ExportReportSheet>
      </div>

      {/* Hero Card */}
      <div className="bg-[#1E40AF] rounded-xl p-6 text-white shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">{contract?.title ?? "--"}</h2>
              <Badge className="bg-[#4ADE80] text-green-900 hover:bg-[#4ADE80] border-0">
                {contractStatus}
              </Badge>
            </div>
            <p className="text-blue-100 text-sm">
              {contract?.contractId ?? "--"} • {contractVendor}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <p className="text-blue-200 text-xs mb-1">Contract Value</p>
            <p className="text-2xl font-bold">{contractValue}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs mb-1">Original Value</p>
            <p className="text-lg font-semibold">{originalValue}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs mb-1">Start Date</p>
            <p className="text-sm font-medium">
              {formatIsoDate(contract?.startDate)}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-xs mb-1">End Date</p>
            <p className="text-sm font-medium">
              {formatIsoDate(contract?.endDate)}
            </p>
          </div>
          <div>
            <p className="text-blue-200 text-xs mb-1">Contract Owner</p>
            <p className="text-sm font-medium">{contractOwner}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, index) => {
          // The BE sends some scores as numeric strings (e.g. budget.score
          // "23.99"); coerce so they don't fall through to 0.
          const numericValue = Number(kpi.value);
          const value = Number.isFinite(numericValue) ? numericValue : 0;
          const max = kpi.maxValue;
          const color = tierToColor(kpi.tier);
          const remainder = Math.max(0, max - value);
          const status =
            kpi.label === "Risk Score"
              ? `${toTitleCase(String(kpi.tier ?? "medium"))} Risk`
              : toTitleCase(String(kpi.tier ?? "good"));

          return (
          <div key={index} className="bg-white dark:bg-slate-900 dark:border-slate-800 p-4 rounded-xl border shadow-sm flex flex-col items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mb-4 self-start">{kpi.label}</p>
            <div className="relative h-24 w-24 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value }, { value: remainder }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={40}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill={color} />
                    <Cell fill="#E2E8F0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-xl font-bold")} style={{ color }}>
                  {kpi.displayType === "percentage" ? `${Math.round(value)}%` : value}
                </span>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "border-0 mt-2",
                tierToBadge(kpi.tier)
              )}
            >
              {status}
            </Badge>
          </div>
          );
        })}
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-xl border shadow-sm flex flex-col max-h-[420px]">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Financial Overview</h3>
          </div>
          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
            {financialRows.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">{item.label}</span>
                <span className={cn("font-semibold", item.color || "text-slate-900 dark:text-slate-100")}>{item.value}</span>
              </div>
            ))}
            <div className="pt-4 border-t mt-4 dark:border-slate-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Current Contract Value</span>
              <span className="font-bold text-blue-700 text-lg">
                {formatMoney(
                  financialStatement?.currentContractValue,
                  financialStatement?.currency,
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-xl border shadow-sm border-l-4 border-l-orange-400 flex flex-col max-h-[420px]">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Alerts & Recommended Actions</h3>
          </div>
          <ul className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
            {alertsRows.map((alert, index) => (
              <li key={index} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
                <span dangerouslySetInnerHTML={{
                  __html: alert.text
                    .replace(/Renew by \d{4}-\d{2}-\d{2}/, '<span class="font-bold text-slate-800 dark:text-slate-100">$&</span>')
                    .replace(/Pending .*? review/, '<span class="font-bold text-slate-800 dark:text-slate-100">$&</span>')
                    .replace(/requires approval/, '<span class="font-bold text-slate-800 dark:text-slate-100">requires approval</span>')
                }} />
              </li>
            ))}
          </ul>
        </div>

        {/* Legal Analysis */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-xl border shadow-sm flex flex-col max-h-[420px]">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Clause & Legal Analysis</h3>
          </div>
          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
            {clauseRows.map((item, index) => (
              <div 
                key={index} 
                className={cn(
                  "p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border-l-4",
                  item.color === "red" ? "border-l-red-500" :
                  item.color === "green" ? "border-l-green-500" : "border-l-yellow-500"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{item.title}</h4>
                  <Badge 
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 border-0 rounded-sm",
                      item.color === "red" ? "bg-red-100 text-red-700" :
                      item.color === "green" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-semibold">Standard:</span> {item.desc.replace("Standard: ", "")}</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300"><span className="font-semibold">Actual:</span> {item.actual.replace("Actual: ", "")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 items-start lg:grid-cols-3 gap-6">
        {/* Deliverable Status */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-xl border shadow-sm flex flex-col">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-6">Deliverable Status</h3>
          <div className="relative h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deliverableChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {deliverableChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {formatNumber(deliverableStatus?.total)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Deliverables</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {deliverableChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">{item.name} <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-xl border shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Activities</h3>
            <div className="flex gap-2 text-xs">
              {activitiesRanges.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  className={cn(
                    "px-2 py-1",
                    r.value === activitiesRange
                      ? "bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-medium"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                  onClick={() => onActivitiesRangeChange?.(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activityChartData}
                margin={{ top: 4, right: 8, left: 4, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  width={32}
                />
                <Tooltip />
                {ACTIVITY_SERIES.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.stroke}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {ACTIVITY_SERIES.map((series) => (
              <div key={series.key} className="flex items-center gap-1.5">
                <div className={cn("w-2 h-2 rounded-full", series.legendClassName)} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">
                  {series.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverable Summary & Vendor KPI */}
        <div className="bg-white dark:bg-slate-900 dark:border-slate-800 p-6 rounded-xl border shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Deliverable Summary</h3>
              <div className="flex gap-2 text-xs">
                {deliverySummaryRanges.map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    className={cn(
                      "px-2 py-1",
                      r.value === deliverySummaryRange
                        ? "bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300 font-medium"
                        : "text-slate-400 dark:text-slate-500",
                    )}
                    onClick={() => onDeliverySummaryRangeChange?.(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{deliverySummaryTotals.total}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-center">
                <p className="text-xs text-green-600 dark:text-green-400">On Time</p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">{deliverySummaryTotals.onTime}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg text-center">
                <p className="text-xs text-orange-600 dark:text-orange-400">Rejected</p>
                <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{deliverySummaryTotals.rejected}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
                <p className="text-xs text-red-600 dark:text-red-400">Late/Missed</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">{deliverySummaryTotals.lateMissed}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Vendor KPI</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Avg. Response Time</span>
                  <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">--</span>
                </div>
                <Progress value={0} className="h-1.5" variant="success" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Quality Score</span>
                  <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">
                    {typeof vendorAvgPercent === "number" ? `${vendorAvgPercent}%` : "--"}
                  </span>
                </div>
                <Progress value={vendorAvgPercent ?? 0} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">On-Time Delivery</span>
                  <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">--</span>
                </div>
                <Progress value={0} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Customer Satisfaction</span>
                  <span className="text-slate-500 dark:text-slate-400 dark:text-slate-500">--</span>
                </div>
                <Progress value={0} className="h-1.5" variant="success" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileCheck className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Amendments & Insurance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              Amendments ({formatNumber(attachments?.amendment)})
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">View all</p>
          </div>
          <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Insurance</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">
              {formatNumber(attachments?.policy)} Policies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
