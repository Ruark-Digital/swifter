import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderLibraryIcon } from "@hugeicons/core-free-icons";

type StatProps = {
  title: string;
  value: number | string;
  tone: "gray" | "green" | "red" | "yellow";
  testId: string;
};

const toneClasses: Record<StatProps["tone"], { wrap: string; icon: string }> = {
  gray: { wrap: "bg-slate-50", icon: "text-slate-600" },
  green: { wrap: "bg-green-50", icon: "text-green-600" },
  red: { wrap: "bg-red-50", icon: "text-red-600" },
  yellow: { wrap: "bg-yellow-50", icon: "text-yellow-600" },
};

const StatCard: React.FC<StatProps> = ({ title, value, tone, testId }) => {
  const c = toneClasses[tone];
  return (
    <Card data-testid={testId} className="border-slate-200">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div
          className={`rounded-full ${c.wrap} h-16 w-16 flex items-center justify-center`}
          aria-hidden
        >
          <div className="rounded-full bg-white/70 h-12 w-12 flex items-center justify-center shadow-sm">
            <HugeiconsIcon icon={FolderLibraryIcon} className={`h-8 w-8 ${c.icon}`} />
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
  linked: number | string;
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
    linked: counts?.linked ?? 0,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="All MSA" value={c.all} tone="gray" testId="msa-stats-all" />
      <StatCard title="Active" value={c.active} tone="green" testId="msa-stats-active" />
      <StatCard title="Draft" value={c.draft} tone="gray" testId="msa-stats-draft" />
      <StatCard title="Suspended" value={c.suspended} tone="red" testId="msa-stats-suspended" />
      <StatCard title="Expired" value={c.expired} tone="red" testId="msa-stats-expired" />
      <StatCard title="Terminated" value={c.terminated} tone="red" testId="msa-stats-terminated" />
      <StatCard title="Pending Approval" value={c.pending} tone="yellow" testId="msa-stats-pending" />
      <StatCard title="Linked Contracts" value={c.linked} tone="gray" testId="msa-stats-linked" />
    </div>
  );
};

export default StatsCards;

