import { FileStack } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";

type Props = {
  data?: {
    active?: number;
    pendingApproval?: number;
    completed?: number;
    terminated?: number;
    suspended?: number;
    draft?: number;
  };
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

export const ContractStatusCard: React.FC<Props> = ({
  data: api,
  selectedRange = "ytd",
  onRangeChange,
}) => {
  const v = api ?? {};

  // Colors mirror the canonical status palette (ContractStatusBadge / list table):
  // active=green, pending_approval=yellow, completed=blue, terminated=red, draft=slate.
  const data = [
    { name: "Active", value: v.active ?? 0, color: "#22C55E" },
    { name: "Pending Approval", value: v.pendingApproval ?? 0, color: "#EAB308" },
    { name: "Completed", value: v.completed ?? 0, color: "#286EE0" },
    { name: "Terminated", value: v.terminated ?? 0, color: "#EF4444" },
    { name: "Suspended", value: v.suspended ?? 0, color: "#F97316" },
    { name: "Draft", value: v.draft ?? 0, color: "#64748B" },
  ];
  // An all-zero breakdown draws no pie slices — show the empty state instead.
  const hasData = data.some((d) => d.value > 0);
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
          Contract Status
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
      <CardContent className="pt-0 space-y-4 flex-1 flex flex-col min-h-0">
        {!hasData ? (
          <AnalyticsEmptyState
            icon={FileStack}
            title="No contract data yet"
            description="The breakdown of contracts by status will appear here once contracts exist."
          />
        ) : (
          <>
        <ChartContainer className="flex-1 min-h-0" config={{} as ChartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={0}
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
        <div className="flex flex-wrap items-center justify-center gap-4 shrink-0">
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

