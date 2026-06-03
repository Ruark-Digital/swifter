import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useParams } from "react-router-dom";
import { format } from "date-fns";

type ClauseCardProps = {
  title: string;
  risk: "LOW RISK" | "MEDIUM RISK" | "HIGH RISK";
  riskTone: "low" | "medium" | "high";
  summary: string;
  fullDetails: React.ReactNode;
  ratesValues?: React.ReactNode;
};

function RiskPill({
  tone,
  children,
}: {
  tone: ClauseCardProps["riskTone"];
  children: string;
}) {
  const bg =
    tone === "low"
      ? "bg-[#DCFCE7]"
      : tone === "medium"
        ? "bg-[#FEF9C3]"
        : "bg-[#FEE2E2]";
  const text =
    tone === "low"
      ? "text-[#166534]"
      : tone === "medium"
        ? "text-[#854D0E]"
        : "text-[#991B1B]";
  return (
    <div className={`inline-flex rounded px-2 py-1 ${bg}`}>
      <span className={`text-xs font-semibold leading-4 ${text}`}>
        {children}
      </span>
    </div>
  );
}

function RatesValuesBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded shadow-[inset_3px_0_0_0_#22C55E] bg-[#F0FDF4] dark:bg-green-950/40 px-2 py-3">
      <div className="text-sm font-semibold leading-5 text-[#14532D] dark:text-green-300">
        💰 Rates & Values
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function RatesTable({
  rows,
  borderColor,
}: {
  rows: Array<{ left: string; middle: string; right: string }>;
  borderColor: string;
}) {
  return (
    <div className="flex w-full flex-col">
      {rows.map((r, idx) => (
        <div
          key={`${r.left}-${idx}`}
          className={`flex justify-center border-b ${idx === rows.length - 1 ? "border-b-0" : ""}`}
          style={{ borderColor }}
        >
          <div className="flex w-[460px] px-1 py-2 text-sm leading-5 text-[#374151] dark:text-slate-300">
            {r.left}
          </div>
          <div className="flex w-[229px] justify-end px-1 py-2 text-sm font-semibold leading-5 text-[#14532D]">
            {r.middle}
          </div>
          <div className="flex w-[345px] justify-end px-1 py-2 text-sm leading-5 text-[#4B5563] dark:text-slate-400">
            {r.right}
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryCard({
  iconSrc,
  iconBg,
  title,
  clausesCount,
  defaultOpen = true,
  children,
}: {
  iconSrc: string;
  iconBg: string;
  title: string;
  clausesCount: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = React.useId();
  return (
    <div className="w-full rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0px_1px_2px_0px_#0000000d]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-5 text-left"
      >
        <div className="flex items-center">
          <div className="rounded-lg p-2" style={{ background: iconBg }}>
            <img src={iconSrc} className="h-6 w-6" alt="" />
          </div>
          <div className="pl-3">
            <div className="text-[18px] font-semibold leading-7 text-[#030712] dark:text-slate-100">
              {title}
            </div>
            <div className="text-sm leading-5 text-[#4B5563] dark:text-slate-400">
              {clausesCount}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <img
            src="/assets/contract-management/clause-library/chevron-down.svg"
            className={`h-6 w-6 transition-transform ${open ? "" : "-rotate-90"}`}
            alt=""
          />
        </div>
      </button>

      {open && (
        <div
          id={contentId}
          className="border-t border-[#E5E7EB] dark:border-slate-800"
        >
          {children}
        </div>
      )}
    </div>
  );
}

function ClauseCard({
  title,
  risk,
  riskTone,
  summary,
  fullDetails,
  ratesValues,
}: ClauseCardProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#F3F4F6] dark:border-slate-800 px-5 py-5">
      <div className="flex items-start justify-between">
        <div className="text-base font-semibold leading-6 text-[#111827] dark:text-slate-100">
          {title}
        </div>
        <RiskPill tone={riskTone}>{risk}</RiskPill>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col rounded border-l-4 border-[#3B82F6] bg-[#EFF6FF] dark:bg-blue-950/40 px-2 py-3">
          <div className="text-sm font-semibold leading-5 text-[#1E3A8A] dark:text-blue-300">
            📋 Summary
          </div>
          <div className="mt-1 text-sm leading-5 text-[#374151] dark:text-slate-300">{summary}</div>
        </div>

        {ratesValues && <RatesValuesBlock>{ratesValues}</RatesValuesBlock>}

        <div className="rounded bg-[#F9FAFB] dark:bg-slate-800/60 p-3">
          <div className="text-sm font-semibold leading-5 text-[#111827] dark:text-slate-100">
            📄 Full Details
          </div>
          <div className="mt-1 text-sm leading-5 text-[#374151] dark:text-slate-300">
            {fullDetails}
          </div>
        </div>
      </div>
    </div>
  );
}

type Props = { isActive?: boolean; currency?: string; vendorName?: string };

type ClauseLibraryResponse = {
  status?: number;
  message?: string;
  data?: {
    analysisReady?: boolean;
    sectionSummariesReady?: boolean;
    overallRiskLevel?: "high" | "medium" | "low" | "none";
    contract?: {
      contractId?: string;
      contractName?: string;
      title?: string;
      vendor?: string;
      value?: number | string;
      currency?: string;
      duration?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    };
    summary?: {
      totalClauses?: number;
      highRisk?: number;
      mediumRisk?: number;
      lowRisk?: number;
    };
    sections?: Array<{
      id?: string;
      title?: string;
      risk?: "low" | "medium" | "high";
      clauses?: Array<{
        id?: string;
        title?: string;
        risk?: "low" | "medium" | "high";
        summary?: string;
        values?: Array<{ label?: string; value?: string | number }>;
        details?: string[];
      }>;
    }>;
  };
};

const sectionIconMap: Record<string, { iconSrc: string; iconBg: string }> = {
  general_terms: {
    iconSrc:
      "/assets/contract-management/clause-library/icon-general-terms.svg",
    iconBg: "#3B82F615",
  },
  financial_terms: {
    iconSrc:
      "/assets/contract-management/clause-library/icon-financial-terms.svg",
    iconBg: "#10B98115",
  },
  schedule_milestones: {
    iconSrc: "/assets/contract-management/clause-library/icon-schedule.svg",
    iconBg: "#F59E0B15",
  },
  liability_insurance: {
    iconSrc: "/assets/contract-management/clause-library/icon-liability.svg",
    iconBg: "#EF444415",
  },
  performance_quality: {
    iconSrc: "/assets/contract-management/clause-library/icon-performance.svg",
    iconBg: "#06B6D415",
  },
  dispute_resolution: {
    iconSrc: "/assets/contract-management/clause-library/icon-disputes.svg",
    iconBg: "#EC489915",
  },
  other_terms: {
    iconSrc: "/assets/contract-management/clause-library/icon-other-terms.svg",
    iconBg: "#64748B15",
  },
};

const toRiskDisplay = (
  risk?: string,
): { risk: ClauseCardProps["risk"]; riskTone: ClauseCardProps["riskTone"] } => {
  const normalized = (risk || "").toLowerCase();
  if (normalized === "high") return { risk: "HIGH RISK", riskTone: "high" };
  if (normalized === "medium")
    return { risk: "MEDIUM RISK", riskTone: "medium" };
  return { risk: "LOW RISK", riskTone: "low" };
};

const formatCurrency = (value?: number | string, currency?: string) => {
  if (value == null) return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "—") return "—";
    const parsed = Number(trimmed.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(parsed);
    }
    return trimmed;
  }
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDateShort = (date?: string) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return format(parsed, "dd MMM yyyy");
};

const escapeHtml = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const riskClassFor = (risk?: string): "low" | "medium" | "high" => {
  const n = (risk || "").toLowerCase();
  if (n === "high") return "high";
  if (n === "medium") return "medium";
  return "low";
};

const riskLabelFor = (risk?: string): string => {
  const n = (risk || "").toLowerCase();
  if (n === "high") return "HIGH RISK";
  if (n === "medium") return "MEDIUM RISK";
  return "LOW RISK";
};

const buildClauseLibraryPrintHtml = (
  data: ClauseLibraryResponse | undefined,
  vendorName?: string,
): string => {
  const contract = data?.data?.contract ?? {};
  const summary = data?.data?.summary ?? {};
  const sections = data?.data?.sections ?? [];

  const sectionsHtml = sections
    .map((section) => {
      const clausesHtml = (section.clauses ?? [])
        .map((clause) => {
          const tone = riskClassFor(clause.risk);
          const label = riskLabelFor(clause.risk);
          const valuesRows = (clause.values ?? [])
            .map(
              (v) => `
              <div class="value-row">
                <div class="value-name">${escapeHtml(v.label || "Value")}</div>
                <div class="value-val">${escapeHtml(v.value ?? "—")}</div>
              </div>`,
            )
            .join("");
          const valuesBlock =
            valuesRows.length > 0
              ? `<div class="values-block">
                   <div class="values-label">💰 Rates &amp; Values</div>
                   ${valuesRows}
                 </div>`
              : "";
          const detailsText =
            clause.details && clause.details.length > 0
              ? clause.details.map((d) => escapeHtml(d)).join("<br/>")
              : "Not specified";
          return `
            <div class="clause">
              <div class="clause-header">
                <div class="clause-title">${escapeHtml(clause.title || "Clause")}</div>
                <span class="risk-pill risk-${tone}">${escapeHtml(label)}</span>
              </div>
              <div class="summary-block">
                <div class="summary-label">📋 Summary</div>
                <div class="summary-text">${escapeHtml(clause.summary || "Not specified")}</div>
              </div>
              ${valuesBlock}
              <div class="details-block">
                <div class="details-label">📄 Full Details</div>
                <div class="details-text">${detailsText}</div>
              </div>
            </div>`;
        })
        .join("");
      return `
        <div class="section">
          <div class="section-header">
            <div class="section-title">${escapeHtml(section.title || "Section")}</div>
            <div class="section-count">${section.clauses?.length || 0} clauses</div>
          </div>
          <div class="section-body">${clausesHtml}</div>
        </div>`;
    })
    .join("");

  const docTitle = escapeHtml(
    `Clause Library - ${contract.contractName || contract.title || contract.contractId || "Contract"}`,
  );

  const durationDisplay =
    contract.duration ||
    `${formatDateShort(contract.startDate)} to ${formatDateShort(contract.endDate)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${docTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; color: #030712; padding: 24px; background: #fff; }
  .title { font-size: 24px; font-weight: 700; color: #2563EB; margin-bottom: 4px; }
  .subtitle { font-size: 14px; color: #4B5563; margin-bottom: 16px; }
  .meta-bar { background: #F5F8FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 15px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
  .meta-cells { display: flex; align-items: center; flex-wrap: wrap; }
  .meta-cell { display: inline-flex; flex-direction: column; padding-right: 24px; border-right: 1px solid #D1D5DB; margin-right: 24px; }
  .meta-cell:last-child { border-right: 0; margin-right: 0; padding-right: 0; }
  .meta-label { font-size: 11px; color: #4B5563; }
  .meta-value { font-size: 14px; font-weight: 600; color: #030712; margin-top: 2px; }
  .meta-value-money { color: #16A34A; }
  .status-pill { display: inline-block; background: #22C55E; color: #fff; border-radius: 999px; padding: 4px 12px; font-size: 13px; font-weight: 600; }
  .section { border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 16px; page-break-inside: avoid; background: #fff; }
  .section-header { padding: 18px 20px; border-bottom: 1px solid #E5E7EB; }
  .section-title { font-size: 18px; font-weight: 600; color: #030712; }
  .section-count { font-size: 14px; color: #4B5563; margin-top: 2px; }
  .clause { padding: 20px; border-bottom: 1px solid #F3F4F6; page-break-inside: avoid; }
  .clause:last-child { border-bottom: 0; }
  .clause-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
  .clause-title { font-size: 16px; font-weight: 600; color: #111827; }
  .risk-pill { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .risk-low { background: #DCFCE7; color: #166534; }
  .risk-medium { background: #FEF9C3; color: #854D0E; }
  .risk-high { background: #FEE2E2; color: #991B1B; }
  .summary-block { background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; }
  .summary-label { font-size: 13px; font-weight: 600; color: #1E3A8A; margin-bottom: 4px; }
  .summary-text { font-size: 13px; color: #374151; line-height: 1.5; }
  .values-block { background: #F0FDF4; border-left: 4px solid #22C55E; border-radius: 4px; padding: 10px 12px; margin-bottom: 10px; }
  .values-label { font-size: 13px; font-weight: 600; color: #14532D; margin-bottom: 4px; }
  .value-row { display: flex; padding: 4px 0; border-bottom: 1px solid #BBF7D0; }
  .value-row:last-child { border-bottom: 0; }
  .value-name { flex: 2; font-size: 13px; color: #374151; }
  .value-val { flex: 1; font-size: 13px; font-weight: 600; color: #14532D; text-align: right; }
  .details-block { background: #F9FAFB; border-radius: 4px; padding: 12px; }
  .details-label { font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 4px; }
  .details-text { font-size: 13px; color: #374151; line-height: 1.55; white-space: pre-wrap; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 20px; page-break-inside: avoid; }
  .stat { border: 1px solid #E5E7EB; border-radius: 8px; padding: 16px; text-align: center; }
  .stat-label { font-size: 13px; color: #4B5563; }
  .stat-value { font-size: 28px; font-weight: 700; margin-top: 4px; }
  .stat-total { color: #2563EB; }
  .stat-high { color: #DC2626; }
  .stat-medium { color: #CA8A04; }
  .stat-low { color: #16A34A; }
  @page { size: A4 portrait; margin: 0.5in; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="title">Clause Library</div>
  <div class="subtitle">Contract Cheat Sheet — Quick Reference Guide</div>

  <div class="meta-bar">
    <div class="meta-cells">
      <div class="meta-cell">
        <span class="meta-label">Contract ID</span>
        <span class="meta-value">${escapeHtml(contract.contractId || "—")}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Contract Name</span>
        <span class="meta-value">${escapeHtml(contract.contractName || contract.title || "—")}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Vendor</span>
        <span class="meta-value">${escapeHtml(vendorName || contract.vendor || "—")}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Contract Value</span>
        <span class="meta-value meta-value-money">${escapeHtml(formatCurrency(contract.value, contract.currency))}</span>
      </div>
      <div class="meta-cell">
        <span class="meta-label">Duration</span>
        <span class="meta-value">${escapeHtml(durationDisplay)}</span>
      </div>
    </div>
    <span class="status-pill">${escapeHtml(contract.status || "—")}</span>
  </div>

  ${sectionsHtml || `<div class="section"><div class="section-header"><div class="section-title">No clauses found.</div></div></div>`}

  <div class="stats">
    <div class="stat"><div class="stat-label">Total Clauses</div><div class="stat-value stat-total">${summary.totalClauses ?? 0}</div></div>
    <div class="stat"><div class="stat-label">High Risk</div><div class="stat-value stat-high">${summary.highRisk ?? 0}</div></div>
    <div class="stat"><div class="stat-label">Medium Risk</div><div class="stat-value stat-medium">${summary.mediumRisk ?? 0}</div></div>
    <div class="stat"><div class="stat-label">Low Risk</div><div class="stat-value stat-low">${summary.lowRisk ?? 0}</div></div>
  </div>

  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.focus(); window.print(); }, 100);
    });
  </script>
</body>
</html>`;
};

const ClauseLibraryTabContent: React.FC<Props> = ({ isActive, vendorName }) => {
  const { id = "" } = useParams<{ id: string }>();
  const [search, setSearch] = React.useState("");

  const { data, isLoading } = useQuery<ClauseLibraryResponse>({
    queryKey: ["contract-clause-library", id],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/contracts/${id}/clauses`,
      });
      return res.data as ClauseLibraryResponse;
    },
    enabled: !!id && !!isActive,
  });

  const contract = data?.data?.contract;
  const summary = data?.data?.summary;
  const sections = React.useMemo(
    () => data?.data?.sections ?? [],
    [data?.data?.sections],
  );

  const handleExportPdf = React.useCallback(() => {
    if (!data) return;
    const html = buildClauseLibraryPrintHtml(data, vendorName);
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      // Popup blocked. Surface a console hint; toast plumbing isn't wired
      // here and ad-hoc browser alerts would feel out of place on a doc view.
      console.warn("Export PDF: popup blocked. Allow popups for this site.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }, [data, vendorName]);

  const filteredSections = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sections;
    return sections
      .map((section) => ({
        ...section,
        clauses:
          section.clauses?.filter((clause) => {
            const haystack = [
              clause.title,
              clause.summary,
              ...(clause.details || []),
              ...(clause.values?.flatMap((v) => [
                v.label,
                String(v.value ?? ""),
              ]) || []),
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(query);
          }) || [],
      }))
      .filter((section) => (section.clauses?.length || 0) > 0);
  }, [sections, search]);

  return (
    <TabsContent value="clause-library" className="space-y-6 pb-8">
      <div className="flex max-w-[1152px] flex-col gap-4 bg-white dark:bg-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold leading-8 text-[#2563EB] dark:text-blue-400">
              Clause Library
            </div>
            <div className="text-sm leading-5 text-[#4B5563] dark:text-slate-400">
              Contract Cheat Sheet - Quick Reference Guide
            </div>
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isLoading || !data}
            className="inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2 hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="/assets/contract-management/clause-library/export-pdf.svg"
              className="h-[18px] w-[18px]"
              alt=""
            />
            <span className="pl-2 text-base leading-6 text-white">
              Export PDF
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[#BFDBFE] dark:border-slate-700 bg-[linear-gradient(90deg,#EFF6FF_0%,#FAF5FF_100%)] dark:bg-none dark:bg-slate-800/60 p-[15px]">
          <div className="inline-flex items-center">
            <div className="inline-flex flex-col">
              <div className="text-xs leading-4 text-[#4B5563] dark:text-slate-400">
                Contract ID
              </div>
              <div className="text-base font-semibold leading-6 text-[#030712] dark:text-slate-100">
                {contract?.contractId || "—"}
              </div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB] dark:bg-slate-700" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563] dark:text-slate-400">
                Contract Name
              </div>
              <div className="text-base font-semibold leading-6 text-[#030712] dark:text-slate-100">
                {contract?.contractName || contract?.title || "—"}
              </div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB] dark:bg-slate-700" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563] dark:text-slate-400">Vendor</div>
              <div className="text-base font-semibold leading-6 text-[#030712] dark:text-slate-100">
                {vendorName || contract?.vendor || "—"}
              </div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB] dark:bg-slate-700" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563] dark:text-slate-400">Contract Value</div>
              <div className="text-base font-semibold leading-6 text-[#16A34A]">
                {formatCurrency(contract?.value, contract?.currency)}
              </div>
            </div>
            <div className="flex flex-col pl-6">
              <div className="h-8 w-px bg-[#D1D5DB] dark:bg-slate-700" />
            </div>
            <div className="inline-flex flex-col pl-6">
              <div className="text-xs leading-4 text-[#4B5563] dark:text-slate-400">Duration</div>
              <div className="text-base font-semibold leading-6 text-[#030712] dark:text-slate-100">
                {contract?.duration ||
                  `${formatDateShort(contract?.startDate)} to ${formatDateShort(contract?.endDate)}`}
              </div>
            </div>
          </div>

          <div className="inline-flex rounded-full bg-[#22C55E] px-3 py-1">
            <span className="text-sm font-semibold leading-5 text-white">
              {contract?.status || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative h-[50px] w-[1152px] overflow-hidden rounded-lg border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-[15px] py-[12px] pl-[47px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clauses... (e.g., payment terms, insurance, liquidated damages)"
          className="h-full w-full bg-transparent text-base text-[#4B5563] dark:text-slate-100 outline-none placeholder:text-[#9CA3AF] dark:placeholder:text-slate-500"
        />
        <img
          src="/assets/contract-management/clause-library/search.svg"
          className="absolute left-[15px] top-[14px] h-5 w-5"
          alt=""
        />
      </div>

      <div className="flex w-[1152px] flex-col gap-6 pb-8">
        <div className="flex w-full flex-col gap-4">
          {isLoading ? (
            <div className="rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-[#4B5563] dark:text-slate-400">
              Loading clause library...
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-[#4B5563] dark:text-slate-400">
              No clauses found.
            </div>
          ) : (
            filteredSections.map((section) => {
              const icon = sectionIconMap[section.id || ""] || {
                iconSrc:
                  "/assets/contract-management/clause-library/icon-other-terms.svg",
                iconBg: "#64748B15",
              };
              return (
                <CategoryCard
                  key={section.id || section.title}
                  iconSrc={icon.iconSrc}
                  iconBg={icon.iconBg}
                  title={section.title || "Section"}
                  clausesCount={`${section.clauses?.length || 0} clauses`}
                >
                  <div className="flex flex-col">
                    {(section.clauses || []).map((clause) => {
                      const risk = toRiskDisplay(clause.risk);
                      const values = (clause.values || []).map((v) => ({
                        left: String(v.label || "Value"),
                        middle: String(v.value ?? "—"),
                        right: "",
                      }));
                      return (
                        <ClauseCard
                          key={clause.id || clause.title}
                          title={clause.title || "Clause"}
                          risk={risk.risk}
                          riskTone={risk.riskTone}
                          summary={clause.summary || "Not specified"}
                          ratesValues={
                            values.length > 0 ? (
                              <RatesTable borderColor="#BBF7D0" rows={values} />
                            ) : undefined
                          }
                          fullDetails={
                            clause.details && clause.details.length > 0
                              ? clause.details.map((d, index) => (
                                  <React.Fragment
                                    key={`${clause.id || clause.title}-detail-${index}`}
                                  >
                                    {d}
                                    {index < clause.details!.length - 1 ? (
                                      <br />
                                    ) : null}
                                  </React.Fragment>
                                ))
                              : "Not specified"
                          }
                        />
                      );
                    })}
                  </div>
                </CategoryCard>
              );
            })
          )}
        </div>

        <div className="flex w-full justify-center gap-4">
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563] dark:text-slate-400">
              Total Clauses
            </div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#2563EB]">
              {summary?.totalClauses ?? 0}
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563] dark:text-slate-400">
              High Risk
            </div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#DC2626]">
              {summary?.highRisk ?? 0}
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563] dark:text-slate-400">
              Medium Risk
            </div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#CA8A04]">
              {summary?.mediumRisk ?? 0}
            </div>
          </div>
          <div className="flex flex-1 flex-col rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 p-[15px] shadow-[0px_1px_2px_0px_#0000000d]">
            <div className="text-center text-sm leading-5 text-[#4B5563] dark:text-slate-400">
              Low Risk
            </div>
            <div className="text-center text-[30px] font-bold leading-9 text-[#16A34A]">
              {summary?.lowRisk ?? 0}
            </div>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default ClauseLibraryTabContent;
