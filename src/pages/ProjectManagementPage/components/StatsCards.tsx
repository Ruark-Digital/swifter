import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { HugeiconsIcon } from '@hugeicons/react'
import { FolderLibraryIcon } from '@hugeicons/core-free-icons'

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  bgClass?: string;
  testId: string;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  bgClass = "bg-slate-50",
  testId,
}) => (
  <Card data-testid={testId} className="border-slate-200 dark:bg-slate-900 dark:border-slate-700">
    {/* Compact on mobile (tighter padding, no side icon, smaller value) so the
        three stats sit in one row instead of three full-height stacked cards;
        the original horizontal layout with icon returns from `sm` up. */}
    <CardContent className="p-3 sm:p-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
      <div className="space-y-0.5 sm:space-y-1 min-w-0">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-tight">
          {title}
        </p>
        <p className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {value}
        </p>
      </div>
      <div
        className={`hidden sm:block rounded-full ${bgClass} dark:bg-slate-800 p-2`}
        aria-hidden="true"
      >
        {icon}
      </div>
    </CardContent>
  </Card>
);

const StatsCards: React.FC<{ counts?: { all?: number; active?: number; completed?: number } }> = ({ counts }) => {
  const c = {
    all: counts?.all ?? 0,
    active: counts?.active ?? 0,
    completed: counts?.completed ?? 0,
  };
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-6">
      <StatCard
        title="All Projects"
        value={c.all}
        testId="stats-all-projects"
        icon={<HugeiconsIcon icon={FolderLibraryIcon} className="h-5 w-5 text-slate-700" />}
        bgClass="bg-slate-50"
      />
      <StatCard
        title="Active projects"
        value={c.active}
        testId="stats-active-projects"
        icon={<HugeiconsIcon icon={FolderLibraryIcon} className="h-5 w-5 text-green-600" />}
        bgClass="bg-green-50"
      />
      <StatCard
        title="Completed Projects"
        value={c.completed}
        testId="stats-completed-projects"
        icon={<HugeiconsIcon icon={FolderLibraryIcon} className="h-5 w-5 text-yellow-600" />}
        bgClass="bg-yellow-50"
      />
    </div>
  );
};

export default StatsCards;
