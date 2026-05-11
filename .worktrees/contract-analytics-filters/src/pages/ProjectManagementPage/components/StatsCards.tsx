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
  <Card data-testid={testId} className="border-slate-200">
    <CardContent className="p-6 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-slate-600">{title}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className={`rounded-full ${bgClass} p-2`} aria-hidden="true">
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        title="CompletedProjects"
        value={c.completed}
        testId="stats-completed-projects"
        icon={<HugeiconsIcon icon={FolderLibraryIcon} className="h-5 w-5 text-yellow-600" />}
        bgClass="bg-yellow-50"
      />
    </div>
  );
};

export default StatsCards;
