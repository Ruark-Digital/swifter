import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type StatProps = {
  title: string;
  value: number | string;
  tone: "gray" | "green" | "red";
  testId: string;
  className?: string;
  onClick?: () => void;
};

const toneClasses: Record<StatProps["tone"], { wrap: string; icon: string }> = {
  gray: { wrap: "bg-slate-50", icon: "text-slate-500" },
  green: { wrap: "bg-green-50", icon: "text-green-600" },
  red: { wrap: "bg-red-50", icon: "text-red-500" },
};

const StatCard: React.FC<StatProps> = ({ title, value, tone, testId, className, onClick }) => {
  const c = toneClasses[tone];
  return (
    <Card
      data-testid={testId}
      className={cn("border-slate-200", onClick ? "cursor-pointer hover:border-[#2A4467] transition-colors" : "", className)}
      onClick={onClick}
    >
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

type VendorCounts = {
  all: number | string;
  active: number | string;
  suspended: number | string;
  closed: number | string;
  terminated: number | string;
};

type VendorStatsCardsProps = {
  counts?: Partial<VendorCounts>;
  onStatusClick?: (status: string) => void;
};

const VendorStatsCards: React.FC<VendorStatsCardsProps> = ({ counts, onStatusClick }) => {
  const c = {
    all: counts?.all ?? 0,
    active: counts?.active ?? 0,
    suspended: counts?.suspended ?? 0,
    closed: counts?.closed ?? 0,
    terminated: counts?.terminated ?? 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="All Contracts"
        value={c.all}
        tone="gray"
        testId="vendor-contracts-stats-all"
        onClick={() => onStatusClick?.("all")}
      />
      <StatCard
        title="Active Contracts"
        value={c.active}
        tone="green"
        testId="vendor-contracts-stats-active"
        onClick={() => onStatusClick?.("active")}
      />
      <StatCard
        title="Suspended"
        value={c.suspended}
        tone="red"
        testId="vendor-contracts-stats-suspended"
        onClick={() => onStatusClick?.("suspended")}
      />
      <StatCard
        title="Closed"
        value={c.closed}
        tone="red"
        testId="vendor-contracts-stats-closed"
        onClick={() => onStatusClick?.("closed")}
      />
      <StatCard
        title="Terminated"
        value={c.terminated}
        tone="red"
        testId="vendor-contracts-stats-terminated"
        className="lg:col-start-1"
        onClick={() => onStatusClick?.("terminated")}
      />
    </div>
  );
};

export default VendorStatsCards;
