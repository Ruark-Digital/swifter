import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type StatProps = {
  title: string;
  value: number | string;
  tone: "gray" | "green" | "red" | "yellow";
  testId: string;
  className?: string
};

const toneClasses: Record<StatProps["tone"], { wrap: string; icon: string }> = {
  gray: { wrap: "bg-slate-50", icon: "text-slate-500" },
  green: { wrap: "bg-green-50", icon: "text-green-600" },
  red: { wrap: "bg-red-50", icon: "text-red-500" },
  yellow: { wrap: "bg-yellow-50", icon: "text-yellow-600" },
};

const StatCard: React.FC<StatProps> = ({ title, value, tone, testId, className }) => {
  const c = toneClasses[tone];
  return (
    <Card data-testid={testId} className={cn("border-slate-200", className)}>
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div
          className={`rounded-full ${c.wrap} h-12 w-12 flex items-center justify-center`}
          aria-hidden
        >
          <div className="rounded-full bg-white/70 h-8 w-8 flex items-center justify-center shadow-sm">
            <FileText className={`h-5 w-5 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type Counts = {
  all: number | string;
  active: number | string;
  draft: number | string;
  suspended: number | string;
  expired: number | string;
  terminated: number | string;
  pending: number | string;
};

const StatsCards: React.FC<{ counts?: Partial<Counts> }> = ({ counts }) => {
  const c = {
    all: counts?.all ?? 0,
    active: counts?.active ?? 0,
    draft: counts?.draft ?? 0,
    suspended: counts?.suspended ?? 0,
    expired: counts?.expired ?? 0,
    terminated: counts?.terminated ?? 0,
    pending: counts?.pending ?? 0,
  };

  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="All Contracts"
        value={c.all}
        tone="gray"
        testId="contracts-stats-all"
        // className="col-span-2"
      />
      <StatCard
        title="Active Contracts"
        value={c.active}
        tone="green"
        testId="contracts-stats-active"
      />
      <StatCard
        title="Draft Contracts"
        value={c.draft}
        tone="gray"
        testId="contracts-stats-draft"
      />
      <StatCard
        title="Suspended"
        value={c.suspended}
        tone="red"
        testId="contracts-stats-suspended"
      />

      <StatCard
        title="Expired"
        value={c.expired}
        tone="red"
        testId="contracts-stats-expired"
      />
      <StatCard
        title="Terminated"
        value={c.terminated}
        tone="red"
        testId="contracts-stats-terminated"
      />
      <StatCard
        title="Pending Approval"
        value={c.pending}
        tone="yellow"
        testId="contracts-stats-pending"
      />
    </div>
  );
};

export default StatsCards;
