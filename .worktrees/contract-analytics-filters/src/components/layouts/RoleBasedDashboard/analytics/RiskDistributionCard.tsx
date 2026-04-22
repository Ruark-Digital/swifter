import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Props = {
  values?: { low: number; medium: number; high: number };
};

export const RiskDistributionCard: React.FC<Props> = ({ values }) => {
  const v = values || { low: 98, medium: 34, high: 12 };
  const data = [
    { name: "Low", value: v.low, color: "#10b981" },
    { name: "Medium", value: v.medium, color: "#f59e0b" },
    { name: "High (> $5M)", value: v.high, color: "#ef4444" },
  ];
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-[16px] font-semibold text-[#030712]">
          Risk Distribution
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
      <CardContent className="pt-0 space-y-4 flex-1 flex flex-col">
        <ChartContainer className="h-full" config={{} as ChartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                dataKey="value"
                label={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex items-center justify-center gap-6">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-[#030712] text-xs">{d.name}</span>
              <span className="text-[#030712] text-sm font-semibold">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
