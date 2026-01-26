import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatProps = {
  title: string;
  value: number | string;
  iconSrc: string;
  iconBg: string;
  testId: string;
};

const StatCard: React.FC<StatProps> = ({ title, value, iconSrc, iconBg, testId }) => {
  return (
    <Card data-testid={testId} className="border border-[#E5E7EB] rounded-xl shadow-none">
      <CardContent className="p-[23px] flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-[#6B6B6B]">{title}</div>
          <div className="text-2xl font-bold text-[#0F0F0F]">{value}</div>
        </div>
        <div className="rounded-full p-[10px]" style={{ background: iconBg }}>
          <img src={iconSrc} className="h-[29px] w-[29px]" />
        </div>
      </CardContent>
    </Card>
  );
};

const AmendmentsStatsCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="All Amendment"
        value={8}
        iconSrc="/assets/contract-management/amendments/file-all.svg"
        iconBg="#0F0F0F1A"
        testId="amendments-stats-all"
      />
      <StatCard
        title="Approved"
        value={4}
        iconSrc="/assets/contract-management/amendments/file-approved.svg"
        iconBg="#43A0471A"
        testId="amendments-stats-approved"
      />
      <StatCard
        title="Pending"
        value={5}
        iconSrc="/assets/contract-management/amendments/file-pending.svg"
        iconBg="#FACC151A"
        testId="amendments-stats-pending"
      />
      <StatCard
        title="Rejected"
        value={5}
        iconSrc="/assets/contract-management/amendments/file-rejected.svg"
        iconBg="#E539351A"
        testId="amendments-stats-rejected"
      />
    </div>
  );
};

export default AmendmentsStatsCards;

