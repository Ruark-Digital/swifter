import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import type { ApiResponseError } from "@/types";
import ApproversTable, { type ApproverRow } from "../components/ApproversTable";
import { contractManagerApi } from "../api/contractManagerApi";

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
};

const ApproversTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const queryKey = useUserQueryKey(["contract-approvers", contractId]);

  const {
    data: approversResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => contractManagerApi.listContractApprovers(contractId),
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!error) return;
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    toastErrorRef.current("Contract Approvers", error as ApiResponseError);
  }, [error]);

  const rows = React.useMemo<ApproverRow[]>(() => {
    const approvers = approversResponse?.data ?? [];
    return approvers.map((approver, index) => {
      const status = approver.status === "Completed" ? "Completed" : "Pending";
      return {
        id: approver.approverId ?? `approver-${index}`,
        name: approver.name?.trim() || "Unknown",
        email: approver.email?.trim() || "-",
        role: approver.role?.trim() || "N/A",
        approvalLevel:
          Array.isArray(approver.approvalLevels) && approver.approvalLevels.length > 0
            ? approver.approvalLevels.join(", ")
            : "-",
        assignedApprovals: approver.assignedApprovals ?? "-",
        status,
      };
    });
  }, [approversResponse?.data]);

  return (
    <TabsContent value="approvers" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Approvers</h3>
        <Button variant="outline" className="h-10 rounded-xl px-4">
          <Share2 className="mr-2 h-4 w-4" /> Export Report
        </Button>
      </div>

      <ApproversTable rows={rows} isLoading={isLoading} contractId={contractId} />
    </TabsContent>
  );
};

export default ApproversTabContent;
