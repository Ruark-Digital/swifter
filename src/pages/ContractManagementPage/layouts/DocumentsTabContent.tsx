import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import DocumentsStatsCard from "../components/DocumentsStatsCard";
import DocumentsList from "../components/DocumentsList";
import type { ContractDetail } from "@/types";
import EditContract from "../components/EditContract";
import { useToastHandler } from "@/hooks/useToaster";
import { useQueryClient } from "@tanstack/react-query";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";
import { useUserRole } from "@/hooks/useUserRole";

type Props = {
  currency?: string;
  files?: ContractDetail["files"];
  contractId?: string;
  onUpdated?: (contract: ContractDetail) => void;
  effectiveDate?: string;
  /** Contract status — drives whether documents are editable. The list
   *  becomes read-only for any status other than `pending_approval`. */
  status?: string;
  actionsDisabled?: boolean;
};

const DocumentsTabContent: React.FC<Props> = ({ files, contractId, onUpdated, effectiveDate, status, actionsDisabled }) => {
  const [editingContractId, setEditingContractId] = React.useState<string | null>(null);
  const { success } = useToastHandler();
  const qc = useQueryClient();
  const { isManager } = useUserRole();

  return (
    <TabsContent value="documents" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-600">Documents</h3>
        <div className="flex items-center gap-2">
          <ExportReportSheet contractId={contractId ?? ""} contractType="Contract">
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </ExportReportSheet>
          
          {isManager && (
            <Button
              onClick={() => {
                if (contractId) {
                  setEditingContractId(contractId);
                }
              }}
              disabled={!!actionsDisabled}
            >
              Edit Contract
            </Button>
          )}
        </div>
      </div>

      <DocumentsStatsCard count={files?.length ?? 0} />

      <DocumentsList
        files={files}
        effectiveDate={effectiveDate}
        contractId={contractId}
        status={status}
      />

      {editingContractId !== null && (
        <EditContract
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingContractId(null);
          }}
          contractId={editingContractId}
          onUpdated={(contract) => {
            success("Contract updated successfully", "Changes saved");
            qc.invalidateQueries({ queryKey: ["contract-manager-contracts"] });
            setEditingContractId(null);
            if (onUpdated) onUpdated(contract);
          }}
        />
      )}
    </TabsContent>
  );
};

export default DocumentsTabContent;
