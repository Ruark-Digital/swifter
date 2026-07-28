import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency } from "@/lib/utils";
import { AnalyticsEmptyState } from "./AnalyticsEmptyState";

type Item = {
  title: string;
  org: string;
  code: string;
  amount: string;
  note: string;
  color: string;
};

type Props = {
  data?: {
    timeline?: Array<{
      contractTitle: string;
      vendor: string;
      contractCode: string;
      value: number;
      daysToExpiry: number;
      timelineStatus: string;
      label: string;
    }>;
  };
};

export const RenewalsTimelineCard: React.FC<Props> = ({ data }) => {
  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];

  const items: Item[] = timeline.map((t) => {
    const status = (t.timelineStatus ?? "").toLowerCase();
    const color =
      status === "critical"
        ? "#DC2626"
        : status === "warning" || status === "warn"
          ? "#F59E0B"
          : "#10B981";

    return {
      title: t.contractTitle,
      org: t.vendor,
      code: t.contractCode,
      amount: formatCompactCurrency(t.value ?? 0, "USD"),
      note: t.label || `${t.daysToExpiry} days`,
      color,
    };
  });
  return (
    <Card className="rounded-2xl border border-[#E5E7EB] dark:border-slate-800 shadow-sm flex flex-col max-h-[32rem]">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-[16px] font-semibold text-[#030712] dark:text-slate-100">
          Renewals & Expiry Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 flex-1 min-h-0 overflow-y-auto">
        {items.length === 0 ? (
          <AnalyticsEmptyState
            icon={CalendarClock}
            title="No upcoming renewals"
            description="Contracts approaching their expiry date will appear here."
          />
        ) : (
          items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-stretch gap-3 rounded-xl border border-[#E5E7EB] dark:border-slate-800 px-3 py-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#030712] dark:text-slate-100 truncate">
                  {item.title}
                </p>
                <p className="text-xs text-[#6B6B6B] dark:text-slate-400 truncate">
                  {item.org} • {item.code}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">
                {item.amount}
              </p>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-400">{item.note}</p>
            </div>
            <div
              aria-hidden="true"
              className="flex shrink-0 items-stretch justify-center self-stretch px-1"
            >
              <div className="flex w-3 justify-center">
                <div
                  data-testid="renewal-timeline-line"
                  className="w-[2px] rounded-full bg-[#E5E7EB] dark:bg-slate-700"
                />
              </div>
            </div>
          </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

