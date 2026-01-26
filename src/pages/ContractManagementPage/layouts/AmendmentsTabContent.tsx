import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AmendmentsStatsCards from "../components/AmendmentsStatsCards";
import AmendmentsTable from "../components/AmendmentsTable";

const AmendmentsTabContent: React.FC = () => {
  return (
    <TabsContent value="amendments" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F]">Amendments</h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="h-[52px] rounded-xl border-[#E5E7EB] px-4 text-base font-semibold text-[#0F0F0F]"
          >
            <img
              src="/assets/contract-management/amendments/share.svg"
              className="mr-2 h-5 w-5"
            />
            Export Report
          </Button>
          <Button className="h-[52px] rounded-xl bg-[#2A4467] px-4 text-base font-semibold text-white hover:bg-[#2A4467]/90">
            <img
              src="/assets/contract-management/amendments/plus.svg"
              className="mr-2 h-5 w-5"
            />
            Create Amendment
          </Button>
        </div>
      </div>

      <AmendmentsStatsCards />

      <AmendmentsTable />
    </TabsContent>
  );
};

export default AmendmentsTabContent;

