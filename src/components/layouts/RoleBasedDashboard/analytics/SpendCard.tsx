import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/utils";

type Props = {
  committed?: number;
  actual?: number;
  currency?: string;
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

export const SpendCard: React.FC<Props> = ({
  committed = 0,
  actual = 0,
  currency = "USD",
  selectedRange = "ytd",
  onRangeChange,
}) => {
  const safeCommitted = Number.isFinite(committed) ? committed : 0;
  const safeActual = Number.isFinite(actual) ? actual : 0;
  const remaining = Math.max(0, safeCommitted - safeActual);
  const utilizationPct =
    safeCommitted > 0 ? Math.round((safeActual / safeCommitted) * 100) : 0;

  const committedLabel = formatCompactCurrency(safeCommitted, currency as any);
  const actualLabel = formatCompactCurrency(safeActual, currency as any);
  const remainingLabel = formatCompactCurrency(remaining, currency as any);

  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
          Committed vs Actual Spend
        </CardTitle>
        <Tabs
          value={selectedRange}
          onValueChange={(value) => onRangeChange?.(value)}
          className="w-full"
        >
          {/* Keep pills on one horizontal line and scroll left/right when
              they overflow — matches the date filters in other dashboard
              cards. `!flex-none shrink-0` defeats shadcn's default
              `flex-1` on TabsTrigger (which would otherwise stretch each
              pill across the full row). */}
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
      <CardContent className="p-4 space-y-5 flex-1 min-h-0 overflow-y-auto">
        {/* Committed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6B6B6B] dark:text-slate-400">
              Committed Spend
            </p>
            <p className="text-sm font-bold text-[#0088FF] dark:text-sky-400">
              {committedLabel}
            </p>
          </div>

          <div className="w-full h-2.5 bg-[#DDDDDD] dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-2.5 bg-[#286EE0] rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Actual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6B6B6B] dark:text-slate-400">
              Actual Spend
            </p>
            <p className="text-sm font-bold text-[#43A047] dark:text-green-400">
              {actualLabel}
            </p>
          </div>
          <div className="w-full h-2.5 bg-[#DDDDDD] dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-2.5 bg-[#43A047] rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, utilizationPct))}%` }}
            />
          </div>
        </div>

        {/* Remaining budget */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-base font-semibold text-[#111827] dark:text-slate-100">
              Remaining Budget
            </p>
            <p className="text-sm text-[#374151] dark:text-slate-400">
              {utilizationPct}% of committed budget utilized
            </p>
          </div>
          <p className="text-xs font-bold text-[#43A047] dark:text-green-400">
            {remainingLabel}
          </p>
        </div>

        {/* Performance callout */}
        <div className="rounded-2xl bg-[#EFF6FF] dark:bg-slate-800 p-4">
          <p className="text-xs font-semibold text-[#111827] dark:text-slate-100">
            Budget Performance
          </p>
          <p className="text-sm text-[#374151] dark:text-slate-300">
            On track with projected spend rate
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
