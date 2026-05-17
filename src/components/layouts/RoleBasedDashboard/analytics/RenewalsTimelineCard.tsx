import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

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
  const timeline = data?.timeline && Array.isArray(data.timeline) && data.timeline.length > 0
    ? data.timeline
    : [
        {
          contractTitle: "AWS Cloud Services",
          vendor: "BlueCorp Industries",
          contractCode: "CON-2024-001",
          value: 2500000,
          daysToExpiry: 30,
          timelineStatus: "critical",
          label: "Expires in 30 days",
        },
        {
          contractTitle: "Office Lease Agreement",
          vendor: "BlueCorp Industries",
          contractCode: "CON-2024-002",
          value: 1200000,
          daysToExpiry: 60,
          timelineStatus: "warning",
          label: "Expires in 60 days",
        },
        {
          contractTitle: "Software Licenses",
          vendor: "BlueCorp Industries",
          contractCode: "CON-2024-003",
          value: 800000,
          daysToExpiry: 90,
          timelineStatus: "ok",
          label: "Expires in 90 days",
        },
      ];

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
      amount: formatCurrency(t.value ?? 0, "en-US", "USD"),
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
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-xl border border-[#E5E7EB] dark:border-slate-800 px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-sm font-medium text-[#030712] dark:text-slate-100">
                  {item.title}
                </p>
                <p className="text-xs text-[#6B6B6B] dark:text-slate-400">
                  {item.org} • {item.code}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#030712] dark:text-slate-100">
                {item.amount}
              </p>
              <p className="text-xs text-[#6B6B6B] dark:text-slate-400">{item.note}</p>
            </div>
            <span className="inline-block w-3 h-3 rounded-sm bg-[#E5E7EB] dark:bg-slate-700 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

