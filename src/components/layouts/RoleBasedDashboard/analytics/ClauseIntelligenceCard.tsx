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

  // Tailwind classes (not inline styles) so dark variants can override
  // the light tint. Inline `style` wins over `dark:bg-*` due to CSS
  // specificity, so we use class-only tints here.
  const tintForSeverity = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === "high" || s === "critical") return "bg-red-50 dark:bg-red-900/30";
    if (s === "medium" || s === "warning") return "bg-amber-50 dark:bg-amber-900/30";
    return "bg-yellow-50 dark:bg-yellow-900/20";
  };
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
          Clause Intelligence (Portfolio Level)
        </CardTitle>
        <Tabs value="ytd" className="w-full">
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
      <CardContent className="space-y-4 pt-0 flex-1 min-h-0 overflow-y-auto flex flex-col">
        <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">Most Negotiated Clauses</p>
        <ChartContainer config={{} as ChartConfig} className="flex-1 min-h-0">
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

        <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">High-Risk Clause Types</p>
        <div className="space-y-3">
          {highRisk.map((h, idx) => {
            return (
              <div
                key={idx}
                className={`rounded-xl p-3 ${tintForSeverity(h.severity)}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">{h.category}</p>
                  <span className="inline-block rounded-lg bg-white dark:bg-slate-900 border border-[#FCA5A5] dark:border-red-900/60 px-2 py-0.5 text-[12px] text-[#DC2626] dark:text-red-300">
                    {h.contracts} contracts
                  </span>
                </div>
                <p className="text-[12px] text-[#6B7280] dark:text-slate-400">
                  Severity: {h.severity}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

