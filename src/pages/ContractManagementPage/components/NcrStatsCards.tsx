import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

type StatProps = {
  title: string;
  value: number | string;
  tone: "gray" | "green" | "yellow";
  testId: string;
};

const toneClasses: Record<StatProps["tone"], { wrap: string; icon: string }> = {
  gray: {
    wrap: "bg-slate-100 dark:bg-slate-800",
    icon: "text-slate-700 dark:text-slate-300",
  },
  green: {
    wrap: "bg-green-100 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
  },
  yellow: {
    wrap: "bg-yellow-100 dark:bg-yellow-900/30",
    icon: "text-yellow-600 dark:text-yellow-300",
  },
};

const StatCard: React.FC<StatProps> = ({ title, value, tone, testId }) => {
  const c = toneClasses[tone];
  return (
    <Card
      data-testid={testId}
      className="border border-[#E5E7EB] dark:border-slate-800 dark:bg-slate-900 rounded-xl shadow-none"
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
        </div>
        <div
          className={`rounded-full ${c.wrap} h-10 w-10 flex items-center justify-center`}
          aria-hidden
        >
          <FileText className={`h-5 w-5 ${c.icon}`} />
        </div>
      </CardContent>
    </Card>
  );
};

type Props = {
  all?: number;
  issued?: number;
  received?: number;
  isLoading?: boolean;
};

const NcrStatsCards: React.FC<Props> = ({ all, issued, received, isLoading }) => {
  void isLoading;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard title="All NCR" value={all ?? 0} tone="gray" testId="ncr-stats-all" />
      <StatCard title="Issued" value={issued ?? 0} tone="green" testId="ncr-stats-issued" />
      <StatCard title="Received" value={received ?? 0} tone="yellow" testId="ncr-stats-received" />
    </div>
  );
};

export default NcrStatsCards;

