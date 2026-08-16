import { ShieldCheck } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";

type Row = {
  label: string;
  right: string;
  valuePct: number;
  color: string;
};

type Props = {
  data?: {
    insuranceActive?: { current: number; total: number; percentage: number };
    securitySubmission?: { current: number; total: number; percentage: number };
    missedApprovals?: number;
    ncrs?: number;
    auditTrailCompleteness?: number;
  };
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

export const ComplianceStatusCard: React.FC<Props> = ({
  data,
  selectedRange = "ytd",
  onRangeChange,
}) => {
  // Show the card only when there's real compliance ACTIVITY to report. The BE
  // returns a standalone `auditTrailCompleteness` (e.g. 89) even for companies
  // with no contracts / insurance / security submissions, which rendered a card
  // carrying a lone 89% bar next to all-zero rows — read as leftover demo data
  // (QA re-report). Match the sibling analytics cards' "all-zero → empty" rule
  // and gate on the activity fields, not the derived percentage.
  const hasData =
    !!data &&
    ((data.insuranceActive?.total ?? 0) > 0 ||
      (data.securitySubmission?.total ?? 0) > 0 ||
      (data.missedApprovals ?? 0) > 0 ||
      (data.ncrs ?? 0) > 0);
  const rows: Row[] = [
    {
      label: "Active Insurance",
      right: `${data?.insuranceActive?.current ?? 0} / ${data?.insuranceActive?.total ?? 0}`,
      valuePct: data?.insuranceActive?.percentage ?? 0,
      color: "#10b981",
    },
    {
      label: "Contract Security Submission",
      right: `${data?.securitySubmission?.current ?? 0} / ${data?.securitySubmission?.total ?? 0}`,
      valuePct: data?.securitySubmission?.percentage ?? 0,
      color: "#10b981",
    },
    {
      label: "Missed Approvals",
      right: `${data?.missedApprovals ?? 0}`,
      valuePct: data?.missedApprovals ?? 0,
      color: "#ef4444",
    },
    {
      label: "NCRs",
      right: `${data?.ncrs ?? 0}`,
      valuePct: data?.ncrs ?? 0,
      color: "#f59e0b",
    },
    {
      label: "Audit Trail Completeness",
      right: `${Math.round(data?.auditTrailCompleteness ?? 0)}%`,
      valuePct: data?.auditTrailCompleteness ?? 0,
      color: "#f59e0b",
    },
  ];
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
          Compliance Status
        </CardTitle>
        <Tabs
          value={selectedRange}
          onValueChange={(value) => onRangeChange?.(value)}
          className="w-full"
        >
          {/* Horizontal scroll on overflow; `!flex-none shrink-0` defeats
              shadcn TabsTrigger's baked-in `flex-1` so pills don't stretch. */}
          <TabsList className="bg-transparent p-0 gap-2 flex overflow-x-auto h-auto w-full justify-start">
            <TabsTrigger
              className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[#667085] dark:text-slate-400 data-[state=active]:bg-[#F0F0F0] data-[state=active]:text-[#2A4467] data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100"
              value="ytd"
            >
              YTD
            </TabsTrigger>
            {["12 months", "6 months", "3 months"].map((t) => (
              <TabsTrigger
                key={t}
                value={t.replace(/\s+/g, "")}
                className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[#667085] dark:text-slate-400 data-[state=active]:bg-[#F0F0F0] data-[state=active]:text-[#2A4467] data-[state=active]:dark:bg-slate-800 data-[state=active]:dark:text-slate-100"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 flex-1 min-h-0 overflow-y-auto">
        {!hasData ? (
          <AnalyticsEmptyState
            icon={ShieldCheck}
            title="No compliance data yet"
            description="Insurance, security and audit compliance will appear here once contracts are active."
          />
        ) : (
          rows.map((row, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">{row.label}</p>
              <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">{row.right}</p>
            </div>
            <div className="w-full h-2.5 bg-[#DDDDDD] dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-2.5 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, row.valuePct))}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

