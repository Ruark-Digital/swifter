import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import LemTable from "../components/LemTable";

const LemTabContent: React.FC = () => {
  return (
    <TabsContent value="lem" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Labor, Equipment & Material Reports
        </h3>
        <Button variant="outline" className="h-10 rounded-xl px-4">
          Upload Rate Sheet
        </Button>
      </div>

      <LemTable />
    </TabsContent>
  );
};

export default LemTabContent;
