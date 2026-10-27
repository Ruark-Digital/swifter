import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type StatProps = {
  title: string;
  value: number | string;
  tone: "gray" | "green" | "red" | "yellow";
  testId: string;
  onClick?: () => void;
  className?: string;
};

const toneClasses: Record<StatProps["tone"], { wrap: string; icon: string }> = {
  gray: {
    wrap: "bg-slate-50 dark:bg-slate-800",
    icon: "text-slate-500 dark:text-slate-300",
  },
  green: {
    wrap: "bg-green-50 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
  },
  red: {
    wrap: "bg-red-50 dark:bg-red-900/30",
    icon: "text-red-500 dark:text-red-400",
  },
  yellow: {
    wrap: "bg-yellow-50 dark:bg-yellow-900/30",
    icon: "text-yellow-600 dark:text-yellow-300",
  },
};

const StatCard: React.FC<StatProps> = ({
  title,
  value,
  tone,
  testId,
  onClick,
  className,
}) => {
  const c = toneClasses[tone];
  return (
    <Card
      data-testid={testId}
      className={cn(
        "border-slate-200 dark:border-slate-800 dark:bg-slate-900",
        onClick
          ? "cursor-pointer hover:border-[#2A4467] dark:hover:border-indigo-500 transition-colors"
          : "",
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {value}
          </p>
        </div>
        <div
          className={`rounded-full ${c.wrap} h-12 w-12 flex items-center justify-center`}
          aria-hidden
        >
          <div className="rounded-full bg-white/70 dark:bg-slate-900/60 h-8 w-8 flex items-center justify-center shadow-sm">
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

type StatsCardsProps = {
  counts?: Partial<Counts>;
  onStatusClick?: (status: string) => void;
};

const StatsCards: React.FC<StatsCardsProps> = ({ counts, onStatusClick }) => {
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
        onClick={() => onStatusClick?.("all")}
      />
      <StatCard
        title="Active Contracts"
        value={c.active}
        tone="green"
        testId="contracts-stats-active"
        onClick={() => onStatusClick?.("active")}
      />
      <StatCard
        title="Draft Contracts"
        value={c.draft}
        tone="gray"
        testId="contracts-stats-draft"
        onClick={() => onStatusClick?.("draft")}
      />
      <StatCard
        title="Suspended"
        value={c.suspended}
        tone="red"
        testId="contracts-stats-suspended"
        onClick={() => onStatusClick?.("suspended")}
      />

      <StatCard
        title="Expired"
        value={c.expired}
        tone="red"
        testId="contracts-stats-expired"
        onClick={() => onStatusClick?.("expired")}
      />
      <StatCard
        title="Terminated"
        value={c.terminated}
        tone="red"
        testId="contracts-stats-terminated"
        onClick={() => onStatusClick?.("terminated")}
      />
      <StatCard
        title="Pending Approval"
        value={c.pending}
        tone="yellow"
        testId="contracts-stats-pending"
        onClick={() => onStatusClick?.("pending_approval")}
      />
    </div>
  );
};

export default StatsCards;
