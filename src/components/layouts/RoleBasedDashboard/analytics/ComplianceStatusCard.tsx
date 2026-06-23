import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const rows: Row[] = [
    {
      label: "Insurance Active",
      right: `${data?.insuranceActive?.current ?? 142} / ${data?.insuranceActive?.total ?? 145}`,
      valuePct: data?.insuranceActive?.percentage ?? 98,
      color: "#10b981",
    },
    {
      label: "Contract Security Submission",
      right: `${data?.securitySubmission?.current ?? 138} / ${data?.securitySubmission?.total ?? 145}`,
      valuePct: data?.securitySubmission?.percentage ?? 95,
      color: "#10b981",
    },
    {
      label: "Missed Approvals",
      right: `${data?.missedApprovals ?? 8}`,
      valuePct: data?.missedApprovals ?? 8,
      color: "#ef4444",
    },
    {
      label: "NCRs",
      right: `${data?.ncrs ?? 23}`,
      valuePct: data?.ncrs ?? 23,
      color: "#f59e0b",
    },
    {
      label: "Audit Trail Completeness",
      right: `${data?.auditTrailCompleteness ?? 89}%`,
      valuePct: data?.auditTrailCompleteness ?? 89,
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
              className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold bg-[#F0F0F0] text-[#2A4467] dark:bg-slate-800 dark:text-slate-100 data-[state=active]:bg-[#F0F0F0] data-[state=active]:dark:bg-slate-800"
              value="ytd"
            >
              YTD
            </TabsTrigger>
            {["12 months", "6 months", "3 months"].map((t) => (
              <TabsTrigger
                key={t}
                value={t.replace(/\s+/g, "")}
                className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[#667085] dark:text-slate-400"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 flex-1 min-h-0 overflow-y-auto">
        {rows.map((row, idx) => (
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
        ))}
      </CardContent>
    </Card>
  );
};

