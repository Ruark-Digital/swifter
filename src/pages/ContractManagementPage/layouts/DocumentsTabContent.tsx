import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import DocumentsStatsCard from "../components/DocumentsStatsCard";
import DocumentsList from "../components/DocumentsList";
import type { ContractDetail } from "@/types";

type Props = {
  files?: ContractDetail["files"];
};

const DocumentsTabContent: React.FC<Props> = ({ files }) => {
  return (
    <TabsContent value="documents" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-600">Documents</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" /> Export Report
          </Button>
          <Button>Edit Contract</Button>
        </div>
      </div>

      <DocumentsStatsCard count={files?.length ?? 0} />

      <DocumentsList files={files} />
    </TabsContent>
  );
};

export default DocumentsTabContent;
