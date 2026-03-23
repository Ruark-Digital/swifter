import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Props = {
  committed?: number;
  actual?: number;
  currency?: string;
};

export const SpendCard: React.FC<Props> = ({
  committed = 0,
  actual = 0,
  currency = "USD",
}) => {
  const safeCommitted = Number.isFinite(committed) ? committed : 0;
  const safeActual = Number.isFinite(actual) ? actual : 0;
  const remaining = Math.max(0, safeCommitted - safeActual);
  const utilizationPct =
    safeCommitted > 0 ? Math.round((safeActual / safeCommitted) * 100) : 0;

  const committedLabel = formatCurrency(safeCommitted, "en-US", currency as any);
  const actualLabel = formatCurrency(safeActual, "en-US", currency as any);
  const remainingLabel = formatCurrency(remaining, "en-US", currency as any);

  return (
    <Card className="rounded-2xl border border-[#E5E7EB] shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[16px] font-semibold text-[#030712]">
          Committed vs Actual Spend
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
      <CardContent className="p-4 space-y-5">
        {/* Committed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold text-[#6B6B6B]">
              Committed Spend
            </p>
            <p className="text-[20px] font-bold text-[#0088FF]">
              {committedLabel}
            </p>
          </div>
          <div className="w-full h-2.5 bg-[#DDDDDD] rounded-full overflow-hidden">
            <div
              className="h-2.5 bg-[#286EE0] rounded-full"
              style={{ width: "100%" }}
            />
          </div>
        </div>
        {/* Actual */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[16px] font-semibold text-[#6B6B6B]">
              Actual Spend
            </p>
            <p className="text-[20px] font-bold text-[#43A047]">
              {actualLabel}
            </p>
          </div>
          <div className="w-full h-2.5 bg-[#DDDDDD] rounded-full overflow-hidden">
            <div
              className="h-2.5 bg-[#43A047] rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, utilizationPct))}%` }}
            />
          </div>
        </div>
        {/* Remaining budget */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[18px] font-semibold text-[#111827]">
              Remaining Budget
            </p>
            <p className="text-[16px] text-[#374151]">
              {utilizationPct}% of committed budget utilized
            </p>
          </div>
          <p className="text-[20px] font-bold text-[#43A047]">
            {remainingLabel}
          </p>
        </div>
        {/* Performance callout */}
        <div className="rounded-2xl bg-[#EFF6FF] p-4">
          <p className="text-[18px] font-semibold text-[#111827]">
            Budget Performance
          </p>
          <p className="text-[16px] text-[#374151]">
            On track with projected spend rate
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
