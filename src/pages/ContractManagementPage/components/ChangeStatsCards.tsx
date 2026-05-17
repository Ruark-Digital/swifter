import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, FileCheck, FileClock, FileX } from "lucide-react";
import type { ContractChangeStatsDTO } from "../api/contractManagerApi";

type StatProps = {
  title: string;
  value: number | string;
  tone: "gray" | "green" | "yellow" | "red";
  testId: string;
  icon?: React.ElementType;
};

const toneClasses: Record<StatProps["tone"], { wrap: string; icon: string }> = {
  gray: { wrap: "bg-slate-50 dark:bg-slate-800", icon: "text-slate-500 dark:text-slate-300" },
  green: { wrap: "bg-green-50 dark:bg-green-900/30", icon: "text-green-600 dark:text-green-400" },
  yellow: { wrap: "bg-yellow-50 dark:bg-yellow-900/30", icon: "text-yellow-600 dark:text-yellow-300" },
  red: { wrap: "bg-red-50 dark:bg-red-900/30", icon: "text-red-500 dark:text-red-400" },
};

const StatCard: React.FC<StatProps> = ({ title, value, tone, testId, icon: Icon = FileText }) => {
  const c = toneClasses[tone];
  return (
    <Card data-testid={testId} className="border-slate-200 dark:border-slate-800 dark:bg-slate-900">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
        </div>
        <div
          className={`rounded-full ${c.wrap} h-12 w-12 flex items-center justify-center`}
          aria-hidden
        >
          <div className="rounded-full bg-white/70 dark:bg-slate-900/60 h-8 w-8 flex items-center justify-center shadow-sm">
            <Icon className={`h-5 w-5 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type Props = {
  stats?: ContractChangeStatsDTO;
  isLoading?: boolean;
  variant?: "manager" | "approver";
};

const ChangeStatsCards: React.FC<Props> = ({ stats, isLoading, variant = "manager" }) => {
  void isLoading;

  if (variant === "approver") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="All Changes"
          value={stats?.all ?? 0}
          tone="gray"
          testId="change-stats-all"
          icon={FileText}
        />
        <StatCard
          title="Approved Changes"
          value={stats?.approved ?? 0}
          tone="green"
          testId="change-stats-approved"
          icon={FileCheck}
        />
        <StatCard
          title="Pending Changes"
          value={stats?.pending ?? 0}
          tone="yellow"
          testId="change-stats-pending"
          icon={FileClock}
        />
        <StatCard
          title="Rejected Changes"
          value={stats?.rejected ?? 0}
          tone="red"
          testId="change-stats-rejected"
          icon={FileX}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="All Changes"
        value={stats?.all ?? 0}
        tone="gray"
        testId="change-stats-all"
      />
      <StatCard
        title="Change Requests"
        value={stats?.request ?? 0}
        tone="green"
        testId="change-stats-request"
      />
      <StatCard
        title="Change Orders"
        value={stats?.order ?? 0}
        tone="yellow"
        testId="change-stats-order"
      />
      <StatCard
        title="Change Directives"
        value={stats?.directive ?? 0}
        tone="red"
        testId="change-stats-directive"
      />
      <StatCard
        title="Change Proposals"
        value={stats?.proposal ?? 0}
        tone="gray"
        testId="change-stats-proposal"
      />
    </div>
  );
};

export default ChangeStatsCards;
