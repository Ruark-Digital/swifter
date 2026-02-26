import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import AnalyticsTab from "../components/AnalyticsTab";

type Props = { isActive?: boolean };

const AnalyticsTabContent: React.FC<Props> = () => {
  return (
    <TabsContent value="analytics" className="space-y-6">
      <AnalyticsTab />
    </TabsContent>
  );
};

export default AnalyticsTabContent;
