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

// The BE has shipped two field-name variants for the same values
// (`totalChangeOrders`/`valueIncreasePercentage` vs `totalCOs`/`percentageIncrease`).
// Accept either so the card renders whichever the API returns.
type ApiData = {
  totalChangeOrders?: number;
  totalCOs?: number;
  valueIncrease?: number;
  valueIncreasePercentage?: number;
  percentageIncrease?: number;
  chartData?: Array<{ date: string; original: number; revised: number }>;
};

type Props = {
  data?: ApiData;
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

export const ChangeOrdersImpactCard: React.FC<Props> = ({
  data,
  selectedRange = "ytd",
  onRangeChange,
}) => {
  const chart = (
    data?.chartData && data.chartData.length > 0 ? data.chartData : []
  ).map((d) => {
    const parsed = new Date(d.date);
    const label = Number.isNaN(parsed.getTime())
      ? d.date
      : new Intl.DateTimeFormat(undefined, { month: "short" }).format(parsed);
    return {
      month: label,
      Original: d.original / 1_000_000,
      Revised: d.revised / 1_000_000,
    };
  });

  const max = Math.max(0, ...chart.map((d) => Math.max(d.Original, d.Revised)));
  const domainMax = max > 0 ? Math.ceil(max / 10) * 10 : 100;
  // A single data point draws no line segment, so surface it as a dot;
  // with a full series keep smooth dot-less lines like the design.
  const showDots = chart.length <= 1;

  const totalChangeOrders = data?.totalChangeOrders ?? data?.totalCOs ?? 0;
  const valueIncreaseM = (data?.valueIncrease ?? 0) / 1_000_000;
  const valueIncreasePercentage =
    data?.valueIncreasePercentage ?? data?.percentageIncrease ?? 0;
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
            Change Orders Impact
          </CardTitle>
          <div className="inline-flex items-center gap-2 border border-[#E5E7EB] dark:border-slate-700 rounded-lg px-3 py-2">
            <span className="text-xs font-medium text-[#6B6B6B] dark:text-slate-400">Top 10</span>
            <span className="inline-block w-3 h-3 rounded-sm bg-[#E5E7EB] dark:bg-slate-700" />
          </div>
        </div>
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
      <CardContent className="pt-0 space-y-4 flex-1 min-h-0 overflow-y-auto">
        <ChartContainer config={{} as ChartConfig} className="">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chart}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                stroke="#E5E7EB"
                strokeDasharray="3 3"
                vertical={false}
              />
              <YAxis
                domain={[0, domainMax]}
                tick={{ fill: "#344054", fontSize: 12, fontWeight: 700 }}
              />
              <XAxis dataKey="month" tick={{ fill: "#6B7280", fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="Original"
                stroke="#10b981"
                strokeWidth={2}
                dot={showDots}
              />
              <Line
                type="monotone"
                dataKey="Revised"
                stroke="#1e3a8a"
                strokeWidth={2}
                dot={showDots}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#F9FAFB] dark:bg-slate-800 p-3 text-center">
            <p className="text-[12px] text-[#6B6B6B] dark:text-slate-400">Total COs</p>
            <p className="text-[18px] font-semibold text-[#030712] dark:text-slate-100">
              {totalChangeOrders}
            </p>
          </div>
          <div className="rounded-xl bg-[#FEE2E2] dark:bg-red-900/30 p-3 text-center">
            <p className="text-[12px] text-[#6B6B6B] dark:text-slate-300">Value Increase</p>
            <p className="text-[18px] font-semibold text-[#B91C1C] dark:text-red-300">
              ${valueIncreaseM.toFixed(1)}
              M{" "}
              <span className="text-[12px] text-[#B91C1C] dark:text-red-300">
                ({valueIncreasePercentage >= 0 ? "+" : ""}
                {valueIncreasePercentage}%)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[#10b981]" />
            <span className="text-xs text-[#030712] dark:text-slate-300">Original</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[#1e3a8a]" />
            <span className="text-xs text-[#030712] dark:text-slate-300">Revised</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
