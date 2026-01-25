import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import DeliverablesStatsCards from "../components/DeliverablesStatsCards";
import DeliverablesTable from "../components/DeliverablesTable";

const DeliverablesTabContent: React.FC = () => {
  return (
    <TabsContent value="deliverables" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Deliverable</h3>
        <Button variant="outline" className="h-10 rounded-xl px-4">
          <Share2 className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <DeliverablesStatsCards />

      <DeliverablesTable />
    </TabsContent>
  );
};

export default DeliverablesTabContent;
