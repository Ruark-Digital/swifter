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
  gray: { wrap: "bg-slate-100", icon: "text-slate-700" },
  green: { wrap: "bg-green-100", icon: "text-green-600" },
  yellow: { wrap: "bg-yellow-100", icon: "text-yellow-600" },
};

const StatCard: React.FC<StatProps> = ({ title, value, tone, testId }) => {
  const c = toneClasses[tone];
  return (
    <Card
      data-testid={testId}
      className="border border-[#E5E7EB] rounded-xl shadow-none"
    >
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-xl font-semibold text-slate-900">{value}</p>
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

const RfiStatsCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard title="All RFI" value={8} tone="gray" testId="rfi-stats-all" />
      <StatCard title="Issued" value={4} tone="green" testId="rfi-stats-issued" />
      <StatCard title="Received" value={5} tone="yellow" testId="rfi-stats-received" />
    </div>
  );
};

export default RfiStatsCards;

