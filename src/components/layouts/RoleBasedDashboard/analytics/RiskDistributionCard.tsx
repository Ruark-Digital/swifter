import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

type Props = {
  values?: { low: number; medium: number; high: number };
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

export const RiskDistributionCard: React.FC<Props> = ({
  values,
  selectedRange = "ytd",
  onRangeChange,
}) => {
  const v = values || { low: 98, medium: 34, high: 12 };
  const data = [
    { name: "Low (< $1M)", value: v.low, color: "#10b981" },
    { name: "Medium ($1M – $5M)", value: v.medium, color: "#f59e0b" },
    { name: "High (> $5M)", value: v.high, color: "#ef4444" },
  ];
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
          Risk Distribution
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
      <CardContent className="pt-0 space-y-4 flex-1 flex flex-col min-h-0">
        <ChartContainer className="flex-1 min-h-0" config={{} as ChartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
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
        <div className="flex items-center justify-center gap-6 shrink-0">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-[#030712] dark:text-slate-300 text-xs">{d.name}</span>
              <span className="text-[#030712] dark:text-slate-100 text-sm font-semibold">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
