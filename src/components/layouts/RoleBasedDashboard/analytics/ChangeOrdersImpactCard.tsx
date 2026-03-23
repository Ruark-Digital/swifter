import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type ApiData = {
  totalCOs: number;
  valueIncrease: number;
  percentageIncrease: number;
  chartData: Array<{ date: string; original: number; revised: number }>;
};

type Props = {
  data?: ApiData;
};

export const ChangeOrdersImpactCard: React.FC<Props> = ({ data }) => {
  const chart = (data?.chartData && data.chartData.length > 0
    ? data.chartData
    : [
        { date: "2025-01", original: 200000, revised: 240000 },
        { date: "2025-02", original: 200000, revised: 260000 },
        { date: "2025-03", original: 200000, revised: 230000 },
        { date: "2025-04", original: 200000, revised: 280000 },
      ]
  ).map((d) => ({
    month: d.date,
    Original: d.original / 1_000_000,
    Revised: d.revised / 1_000_000,
  }));

  const max = Math.max(0, ...chart.map((d) => Math.max(d.Original, d.Revised)));
  const domainMax = max > 0 ? Math.ceil(max / 10) * 10 : 100;
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-[#030712]">
            Change Orders Impact
          </CardTitle>
          <div className="inline-flex items-center gap-2 border border-[#E5E7EB] rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-[#6B6B6B]">Top 10</span>
            <span className="inline-block w-3 h-3 rounded-sm bg-[#E5E7EB]" />
          </div>
        </div>
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
      <CardContent className="pt-0 space-y-4">
        <ChartContainer config={{} as ChartConfig} className="aspect-[16/9]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
              <YAxis domain={[0, domainMax]} tick={{ fill: "#344054", fontSize: 12, fontWeight: 700 }} />
              <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Original" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Revised" stroke="#1e3a8a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F9FAFB] p-3 text-center">
            <p className="text-[12px] text-[#6B6B6B]">Total COs</p>
            <p className="text-[18px] font-semibold text-[#030712]">
              {data?.totalCOs ?? 142}
            </p>
          </div>
          <div className="rounded-xl bg-[#FEE2E2] p-3 text-center">
            <p className="text-[12px] text-[#6B6B6B]">Value Increase</p>
            <p className="text-[18px] font-semibold text-[#B91C1C]">
              $
              {(((data?.valueIncrease ?? 100_000_000) as number) / 1_000_000).toFixed(1)}
              M{" "}
              <span className="text-[12px] text-[#B91C1C]">
                ({(data?.percentageIncrease ?? 15.8) >= 0 ? "+" : ""}
                {data?.percentageIncrease ?? 15.8}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[#10b981]" />
            <span className="text-xs text-[#030712]">Original</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[#1e3a8a]" />
            <span className="text-xs text-[#030712]">Revised</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
