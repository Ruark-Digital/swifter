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
};

export const ComplianceStatusCard: React.FC<Props> = ({ data }) => {
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
    <Card className="rounded-2xl border border-[#E5E7EB] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[16px] font-semibold text-[#030712]">
          Compliance Status
        </CardTitle>
        <Tabs value="ytd" className="w-full">
          <TabsList className="bg-transparent p-0 gap-2">
            <TabsTrigger className="rounded-md px-3 py-2 text-sm font-semibold bg-[#F0F0F0] text-[#2A4467]" value="ytd">
              YTD
            </TabsTrigger>
            {["12 months", "6 months", "3 months"].map((t) => (
              <TabsTrigger key={t} value={t.replace(/\s+/g, "")} className="rounded-md px-3 py-2 text-sm font-semibold text-[#667085]">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {rows.map((row, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#030712]">{row.label}</p>
              <p className="text-sm font-semibold text-[#030712]">{row.right}</p>
            </div>
            <div className="w-full h-2.5 bg-[#DDDDDD] rounded-full overflow-hidden">
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

