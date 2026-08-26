import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2, Upload } from "lucide-react";
import DocumentsStatsCard from "../components/DocumentsStatsCard";
import UploadDocumentsDialog from "../components/UploadDocumentsDialog";
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
   *  is editable while `draft` or `pending_approval`, and becomes
   *  read-only for any other (terminal) status. */
  status?: string;
  actionsDisabled?: boolean;
  /** Passed through to the document rows' "Analyze in Clause Library" action.
   *  Provided by the detail page only when the Clause Library tab is visible;
   *  invoked after a successful analysis to switch to that tab. */
  onNavigateToClauseLibrary?: () => void;
};

const DocumentsTabContent: React.FC<Props> = ({ files, contractId, onUpdated, effectiveDate, status, onNavigateToClauseLibrary }) => {
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
          
          {isManager && contractId && (
            <UploadDocumentsDialog
              contractId={contractId}
              trigger={
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Upload Documents
                </Button>
              }
            />
          )}

          {isManager && (
            <Button
              onClick={() => {
                if (contractId) {
                  setEditingContractId(contractId);
                }
              }}
              // Owners may edit any non-terminal contract; live (non-draft)
              // edits re-enter the approval chain via EditContract (QA #118).
              // Terminal states stay locked. Mirrors the Overview tab gate.
              disabled={
                !["draft", "pending_approval", "active", "publish"].includes(
                  String(status ?? ""),
                )
              }
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
        contractType="Contract"
        onNavigateToClauseLibrary={onNavigateToClauseLibrary}
      />

      {/* Kept mounted while on the detail page (not conditionally rendered) so
          unsaved edits survive an accidental close/reopen; only `open` toggles. */}
      {contractId && (
        <EditContract
          open={editingContractId !== null}
          onOpenChange={(open) => {
            if (!open) setEditingContractId(null);
          }}
          contractId={contractId}
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
