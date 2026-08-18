import React from "react";
import { ChevronDown } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";
import { ContractStatusBadge, type Status } from "@/pages/ContractManagementPage/components/StatusBadge";

type ClauseCardProps = {
  title: string;
  risk: "LOW RISK" | "MEDIUM RISK" | "HIGH RISK";
  riskTone: "low" | "medium" | "high";
  summary: string;
  fullDetails: React.ReactNode;
  ratesValues?: React.ReactNode;
};

type SectionAiSummaryData = {
  headline?: string;
  keyObligations?: string[];
  risks?: string[];
  opportunities?: string[];
  recommendedActions?: string[];
  riskLevel?: "low" | "medium" | "high" | "none";
  generatedAt?: string;
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
  defaultOpen = false,
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
          <ChevronDown
            aria-hidden="true"
            className={`h-6 w-6 text-[#4B5563] dark:text-slate-400 transition-transform ${open ? "" : "-rotate-90"}`}
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

const AI_LIST_TONE = {
  blue: "border-[#3B82F6] bg-[#EFF6FF] dark:bg-blue-950/40 text-[#1E3A8A] dark:text-blue-300",
  red: "border-[#EF4444] bg-[#FEF2F2] dark:bg-red-950/40 text-[#991B1B] dark:text-red-300",
  green:
    "border-[#22C55E] bg-[#F0FDF4] dark:bg-green-950/40 text-[#14532D] dark:text-green-300",
  slate:
    "border-[#64748B] bg-[#F8FAFC] dark:bg-slate-800/60 text-[#334155] dark:text-slate-300",
} as const;

function AiList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: keyof typeof AI_LIST_TONE;
}) {
  return (
    <div className={`rounded border-l-4 px-3 py-2 ${AI_LIST_TONE[tone]}`}>
      <div className="text-sm font-semibold leading-5">{title}</div>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-5 text-[#374151] dark:text-slate-300">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// Rendered in place of clauses when the BE extracted none but still returned a
// section-level AI analysis (QA #100). Surfaces the analysis the backend already
// produced so the section reads as informative rather than empty.
function SectionAiSummary({
  summary,
  sectionSummary,
}: {
  summary?: SectionAiSummaryData;
  sectionSummary?: string;
}) {
  const has = (arr?: string[]) => Array.isArray(arr) && arr.length > 0;
  const hasAnalysis =
    !!summary &&
    (!!summary.headline ||
      has(summary.keyObligations) ||
      has(summary.risks) ||
      has(summary.opportunities) ||
      has(summary.recommendedActions));

  if (!hasAnalysis) {
    return (
      <div className="px-5 py-5 text-sm leading-5 text-[#4B5563] dark:text-slate-400">
        {sectionSummary?.trim() || "No clauses were extracted for this section."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-base font-semibold leading-6 text-[#111827] dark:text-slate-100">
          {summary?.headline || "AI Analysis"}
        </div>
        {summary?.riskLevel && summary.riskLevel !== "none" && (
          <RiskPill tone={riskClassFor(summary.riskLevel)}>
            {riskLabelFor(summary.riskLevel)}
          </RiskPill>
        )}
      </div>
      {has(summary?.keyObligations) && (
        <AiList title="✅ Key Obligations" items={summary!.keyObligations!} tone="blue" />
      )}
      {has(summary?.risks) && (
        <AiList title="⚠️ Risks" items={summary!.risks!} tone="red" />
      )}
      {has(summary?.opportunities) && (
        <AiList title="💡 Opportunities" items={summary!.opportunities!} tone="green" />
      )}
      {has(summary?.recommendedActions) && (
        <AiList
          title="📌 Recommended Actions"
          items={summary!.recommendedActions!}
          tone="slate"
        />
      )}
    </div>
  );
}

type Props = {
  isActive?: boolean;
  currency?: string;
  vendorName?: string;
  /** "Contract" hits /contract/manager/contracts/:id/clauses (default),
   *  "MsaContract" hits /contract/manager/msa-contracts/:id/clauses. */
  contractType?: "Contract" | "MsaContract";
};

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
      /** Section-level AI analysis the BE returns even when no individual
       *  clauses were extracted (e.g. a document with no readable clause text).
       *  Rendered as a fallback so the section isn't blank. */
      sectionSummary?: string;
      fullDetails?: string;
      aiSummary?: SectionAiSummaryData;
      clauses?: Array<{
        id?: string;
        title?: string;
        risk?: "low" | "medium" | "high";
        summary?: string;
        values?: Array<{ label?: string; value?: string | number }>;
        /** 2-4 sentence breakdown from the API. */
        fullDetails?: string;
        /** Legacy array shape kept as a fallback. */
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

const ClauseLibraryTabContent: React.FC<Props> = ({
  isActive,
  vendorName,
  contractType = "Contract",
}) => {
  const { id = "" } = useParams<{ id: string }>();
  const toastHandler = useToastHandler();
  const [search, setSearch] = React.useState("");
  const resourceSegment =
    contractType === "MsaContract" ? "msa-contracts" : "contracts";

  const { data, isLoading } = useQuery<ClauseLibraryResponse>({
    queryKey: ["contract-clause-library", contractType, id],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/${resourceSegment}/${id}/clauses`,
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

  // Export is server-generated: GET the BE endpoint as a binary blob and hand
  // the file to the browser. The old client-side print-to-PDF never fired the
  // print dialog reliably, so the button appeared dead (QA #186).
  const exportMutation = useMutation({
    mutationKey: ["clause-library", "export", contractType, id],
    mutationFn: async () =>
      await getRequest({
        url: `/contract/manager/${resourceSegment}/${id}/clauses/export`,
        config: { responseType: "blob", params: { format: "pdf" } },
      }),
    onSuccess: (res) => {
      const blob = res.data as Blob;
      // Prefer the server's filename (Content-Disposition); fall back to a
      // contract-scoped name when the header isn't exposed via CORS.
      const disposition = String(res.headers?.["content-disposition"] ?? "");
      const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
      const fileName = match?.[1]
        ? decodeURIComponent(match[1])
        : `Clause-Library-${contract?.contractId ?? id}.pdf`;
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("Export PDF", error);
    },
  });

  const handleExportPdf = React.useCallback(() => {
    if (!data || exportMutation.isPending) return;
    exportMutation.mutate();
  }, [data, exportMutation]);

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
              clause.fullDetails,
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
      <div className="flex max-w-[1152px] flex-col gap-4 bg-white dark:bg-slate-900 py-4">
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
            disabled={isLoading || !data || exportMutation.isPending}
            className="inline-flex items-center rounded-lg bg-[#2563EB] px-4 py-2 hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img
              src="/assets/contract-management/clause-library/export-pdf.svg"
              className="h-[18px] w-[18px]"
              alt=""
            />
            <span className="pl-2 text-base leading-6 text-white">
              {exportMutation.isPending ? "Exporting..." : "Export PDF"}
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
                {`${formatDateShort(contract?.startDate)} to ${formatDateShort(contract?.endDate)}`}
              </div>
            </div>
          </div>

          <ContractStatusBadge status={contract?.status as Status} />
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
                    {(section.clauses?.length || 0) === 0 && (
                      <SectionAiSummary
                        summary={section.aiSummary}
                        sectionSummary={section.sectionSummary}
                      />
                    )}
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
                            clause.fullDetails?.trim()
                              ? clause.fullDetails
                              : clause.details && clause.details.length > 0
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
