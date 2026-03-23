import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type Props = {
  data?: {
    mostNegotiatedClauses?: Array<{ category: string; count: number }>;
    highRiskClauseTypes?: Array<{ category: string; contracts: number; severity: string }>;
  };
};

export const ClauseIntelligenceCard: React.FC<Props> = ({ data }) => {
  const mostNegotiated =
    data?.mostNegotiatedClauses &&
    Array.isArray(data.mostNegotiatedClauses) &&
    data.mostNegotiatedClauses.length > 0
      ? data.mostNegotiatedClauses
      : [
          { category: "Warranties", count: 50 },
          { category: "Indemnities", count: 75 },
          { category: "Termination", count: 40 },
          { category: "Payment Terms", count: 30 },
          { category: "LDs", count: 65 },
        ];

  const max = Math.max(1, ...mostNegotiated.map((m) => m.count ?? 0));
  const radarData = mostNegotiated.map((m) => ({
    label: m.category,
    value: Math.round(((m.count ?? 0) / max) * 100),
  }));

  const highRisk =
    data?.highRiskClauseTypes &&
    Array.isArray(data.highRiskClauseTypes) &&
    data.highRiskClauseTypes.length > 0
      ? data.highRiskClauseTypes
      : [
          { category: "Liquidated Damages", contracts: 78, severity: "high" },
          { category: "Indemnities", contracts: 65, severity: "medium" },
          { category: "Termination Rights", contracts: 52, severity: "low" },
        ];

  const tintForSeverity = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === "high" || s === "critical") return "#FEE2E2";
    if (s === "medium" || s === "warning") return "#FEF3C7";
    return "#FEFCE8";
  };
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[16px] font-semibold text-[#030712]">
          Clause Intelligence (Portfolio Level)
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
        <p className="text-sm font-semibold text-[#030712]">Most Negotiated Clauses</p>
        <ChartContainer config={{} as ChartConfig} className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: "#6B7280", fontSize: 12 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#286EE0"
                fill="rgba(40, 110, 224, 0.25)"
                fillOpacity={1}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <p className="text-sm font-semibold text-[#030712]">High-Risk Clause Types</p>
        <div className="space-y-3">
          {highRisk.map((h, idx) => (
            <div
              key={idx}
              className="rounded-xl p-3"
              style={{ backgroundColor: tintForSeverity(h.severity) }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#030712]">{h.category}</p>
                <span className="inline-block rounded-lg bg-white border border-[#FCA5A5] px-2 py-0.5 text-[12px] text-[#DC2626]">
                  {h.contracts} contracts
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280]">
                Severity: {h.severity}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

