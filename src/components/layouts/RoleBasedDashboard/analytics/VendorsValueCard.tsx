import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Row = {
  name: string;
  value: number;
  contractCount?: number;
};

type Props = {
  rows?: Row[];
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

const MAX_VENDOR_LABEL_LENGTH = 14;

export const VendorsValueCard: React.FC<Props> = ({
  rows,
  selectedRange = "ytd",
  onRangeChange,
}) => {
  const data = (rows && rows.length > 0
    ? rows
    : [
        { name: "BuildCorp Ltd", value: 3500000, contractCount: 8 },
        { name: "TechServices Inc", value: 2800000, contractCount: 6 },
      ]
  ).map((r) => ({
    name: r.name,
    valueM: r.value / 1_000_000,
    contractCount: r.contractCount ?? 0,
  }));

  const max = Math.max(0, ...data.map((d) => d.valueM));
  const domainMax = max > 0 ? Math.ceil(max / 10) * 10 : 100;
  const formatVendorTick = (name: string) =>
    name.length > MAX_VENDOR_LABEL_LENGTH
      ? `${name.slice(0, MAX_VENDOR_LABEL_LENGTH)}…`
      : name;
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-[#0F0F0F] dark:text-slate-100">
            Contract Value by vendors
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
              value="ytd"
              className="!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold bg-[#F0F0F0] text-[#2A4467] dark:bg-slate-800 dark:text-slate-100 data-[state=active]:bg-[#F0F0F0] data-[state=active]:dark:bg-slate-800"
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
      <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
        <ChartContainer className="flex-1 min-h-0" config={{} as ChartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
            >
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <YAxis
                domain={[0, domainMax]}
                tick={{ fill: "#344054", fontSize: 12, fontWeight: 700 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Value ($M)",
                  angle: -90,
                  position: "insideLeft",
                  offset: -5,
                  fill: "#344054",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: "#475467", fontSize: 12, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                tickFormatter={formatVendorTick}
                minTickGap={10}
                height={56}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
                content={({ active, payload }) =>
                  active && payload && payload.length ? (
                    <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-2xl p-2 w-[140px] shadow">
                      <p className="text-[14px] font-medium text-[#0F0F0F] dark:text-slate-100">
                        {payload[0].payload.name}
                      </p>
                      <p className="text-[12px] text-[#6B6B6B] dark:text-slate-400">
                        {payload[0].payload.contractCount}{" "}
                        {payload[0].payload.contractCount === 1 ? "Contract" : "Contracts"}
                      </p>
                      <p className="text-[12px] text-[#6B6B6B] dark:text-slate-400">
                        ${Number(payload[0].value).toFixed(1)}M
                      </p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="valueM" fill="#286EE0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
