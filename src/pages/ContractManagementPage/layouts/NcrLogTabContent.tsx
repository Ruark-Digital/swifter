import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import NcrStatsCards from "../components/NcrStatsCards";
import NcrTable from "../components/NcrTable";

const NcrLogTabContent: React.FC = () => {
  return (
    <TabsContent value="ncr-log" className="space-y-6">
      <h3 className="text-base font-semibold text-slate-900">
        Non-Compliance Report
      </h3>

      <NcrStatsCards />

      <NcrTable />
    </TabsContent>
  );
};

export default NcrLogTabContent;

