import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import type { ContractClaimStatsDTO } from "../api/contractManagerApi";

type StatProps = {
  title: string;
  value: number | string;
  tone: "gray" | "green" | "yellow" | "red";
  testId: string;
};

const toneClasses: Record<StatProps["tone"], { wrap: string; icon: string }> = {
  gray: { wrap: "bg-slate-50", icon: "text-slate-500" },
  green: { wrap: "bg-green-50", icon: "text-green-600" },
  yellow: { wrap: "bg-yellow-50", icon: "text-yellow-600" },
  red: { wrap: "bg-red-50", icon: "text-red-500" },
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
        <div className={`rounded-full ${c.wrap} h-12 w-12 flex items-center justify-center`} aria-hidden>
          <div className="rounded-full bg-white/70 h-8 w-8 flex items-center justify-center shadow-sm">
            <FileText className={`h-5 w-5 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type Props = {
  stats?: ContractClaimStatsDTO;
  isLoading?: boolean;
};

const ClaimsStatsCards: React.FC<Props> = ({ stats, isLoading }) => {
  void isLoading;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="All Claims"
        value={stats?.total ?? 0}
        tone="gray"
        testId="claims-stats-all"
      />
      <StatCard
        title="Approved Claims"
        value={stats?.approved ?? 0}
        tone="green"
        testId="claims-stats-approved"
      />
      <StatCard
        title="Under Review Claims"
        value={stats?.pending ?? 0}
        tone="yellow"
        testId="claims-stats-review"
      />
      <StatCard
        title="Rejected Claims"
        value={stats?.rejected ?? 0}
        tone="red"
        testId="claims-stats-rejected"
      />
    </div>
  );
};

export default ClaimsStatsCards;

