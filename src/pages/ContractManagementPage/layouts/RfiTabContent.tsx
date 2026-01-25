import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import RfiStatsCards from "../components/RfiStatsCards";
import RfiTable from "../components/RfiTable";

const RfiTabContent: React.FC = () => {
  return (
    <TabsContent value="rfi" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">RFI</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 rounded-xl px-4">
            <Share2 className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button variant="secondary" className="h-10 rounded-xl px-4">
            Issue RFI
          </Button>
        </div>
      </div>

      <RfiStatsCards />

      <Tabs defaultValue="all" className="w-full bg-transparent">
        <TabsList className="bg-[#F2F4F7] p-1 rounded-full w-fit">
          <TabsTrigger
            value="all"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            All RFI
          </TabsTrigger>
          <TabsTrigger
            value="issued"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Issued
          </TabsTrigger>
          <TabsTrigger
            value="received"
            className="rounded-full px-4 py-2 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Received
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <RfiTable />
        </TabsContent>
        <TabsContent value="issued">
          <RfiTable />
        </TabsContent>
        <TabsContent value="received">
          <RfiTable />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default RfiTabContent;
