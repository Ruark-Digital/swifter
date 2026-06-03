import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  values?: { draft: number; review: number; approval: number; execution: number };
  bottleneck?: { stage: string; days: number; reason: string };
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

function Row({
  label,
  days,
  max,
}: {
  label: string;
  days: number;
  max: number;
}) {
  const widthPct = Math.round((days / max) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">{label}</p>
        <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">{days} days</p>
      </div>
      <div className="w-full h-3 bg-gray-200 dark:bg-slate-800 rounded-full">
        <div
          className="h-3 bg-blue-600 rounded-full"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

export const CycleTimeCard: React.FC<Props> = ({
  values,
  bottleneck,
  selectedRange = "ytd",
  onRangeChange,
}) => {
  const v = values || { draft: 5, review: 8, approval: 12, execution: 6 };
  const max = Math.max(...Object.values(v), 12);

  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-[#0F0F0F] dark:text-slate-100">
            Average Cycle Time per Stage
          </CardTitle>
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
              className={cn(
                "!flex-none shrink-0 rounded-md px-3 py-2 text-sm font-semibold",
                "bg-[#F0F0F0] text-[#2A4467] dark:bg-slate-800 dark:text-slate-100 data-[state=active]:bg-[#F0F0F0] data-[state=active]:dark:bg-slate-800"
              )}
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
      <CardContent className="space-y-4">
        <Row label="Draft" days={v.draft} max={max} />
        <Row label="Review" days={v.review} max={max} />
        <Row label="Approval" days={v.approval} max={max} />
        <Row label="Execution" days={v.execution} max={max} />

        {(bottleneck?.stage || bottleneck?.reason) && (
          <div className="rounded-md bg-[#FEFCE8] dark:bg-yellow-900/30 border border-[#FDE68A] dark:border-yellow-900/50 p-3">
            <p className="text-[#854D0E] dark:text-yellow-200 text-sm">
              <span className="font-bold">Bottleneck Alert:</span>{" "}
              {bottleneck?.stage ? `${bottleneck.stage} stage` : "Stage"}{" "}
              {typeof bottleneck?.days === "number"
                ? `averaging ${bottleneck.days} days`
                : ""}
              {bottleneck?.reason ? ` (${bottleneck.reason})` : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
