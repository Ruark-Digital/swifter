import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import KpiTable from "../components/KpiTable";

const KpiTabContent: React.FC = () => {
  return (
    <TabsContent value="kpi" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F]">
          Key Performance Indicator
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-[15px] py-3 text-base font-semibold text-[#0F0F0F]"
        >
          <img
            src="/assets/contract-management/kpi/share.svg"
            className="h-5 w-5"
          />
          Export Report
        </button>
      </div>

      <KpiTable />
    </TabsContent>
  );
};

export default KpiTabContent;

