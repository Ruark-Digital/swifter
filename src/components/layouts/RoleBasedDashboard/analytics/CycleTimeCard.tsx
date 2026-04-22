import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  values?: { draft: number; review: number; approval: number; execution: number };
  bottleneck?: { stage: string; days: number; reason: string };
  selectedRange?: string;
  onRangeChange?: (value: string) => void;
};

export const CycleTimeCard: React.FC<Props> = ({
  values,
  bottleneck,
  selectedRange = "ytd",
  onRangeChange,
}) => {
  const v = values || { draft: 5, review: 8, approval: 12, execution: 6 };
  const max = Math.max(...Object.values(v), 12);
  const pct = (x: number) => Math.round((x / max) * 100);

  const Row = ({ label, days }: { label: string; days: number }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#030712]">{label}</p>
        <p className="text-sm font-semibold text-[#030712]">{days} days</p>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full">
        <div
          className="h-3 bg-blue-600 rounded-full"
          style={{ width: `${pct(days)}%` }}
        />
      </div>
    </div>
  );

  return (
    <Card className="rounded-2xl border border-[#E5E7EB]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[16px] font-semibold text-[#0F0F0F]">
            Average Cycle Time per Stage
          </CardTitle>
        </div>
        <Tabs
          value={selectedRange}
          onValueChange={(value) => onRangeChange?.(value)}
          className="w-full"
        >
          <TabsList className="bg-transparent p-0 gap-2">
            <TabsTrigger
              value="ytd"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold",
                "bg-[#F0F0F0] text-[#2A4467]"
              )}
            >
              YTD
            </TabsTrigger>
            {["12 months", "6 months", "3 months"].map((t) => (
              <TabsTrigger
                key={t}
                value={t.replace(/\s+/g, "")}
                className="rounded-md px-3 py-2 text-sm font-semibold text-[#667085]"
              >
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        <Row label="Draft" days={v.draft} />
        <Row label="Review" days={v.review} />
        <Row label="Approval" days={v.approval} />
        <Row label="Execution" days={v.execution} />

        {(bottleneck?.stage || bottleneck?.reason) && (
          <div className="rounded-md bg-[#FEFCE8] border border-[#FDE68A] p-3">
            <p className="text-[#854D0E] text-sm">
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
