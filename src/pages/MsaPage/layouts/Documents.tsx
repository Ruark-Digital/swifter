import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUserRole } from "@/hooks/useUserRole";
import { getRequest } from "@/lib/axiosInstance";
import type { File as ContractFile } from "@/types";
import DocumentsStatsCard from "@/pages/ContractManagementPage/components/DocumentsStatsCard";
import DocumentsList from "@/pages/ContractManagementPage/components/DocumentsList";
import CreateMSADialog from "./CreateMSADialog";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

type DocumentsProps = {
  contractId: string;
  files?: ContractFile[];
  isActive?: boolean;
  /** MSA status — read-only documents for anything other than
   *  `pending_approval`. Comes from the parent `MsaDetailPage`. */
  status?: string;
};

type MsaDetailsApiResponse = {
  message?: string;
  data?: {
    files?: ContractFile[];
    createdAt?: string;
    startDate?: string;
    status?: string;
  };
};

const Documents: React.FC<DocumentsProps> = ({
  contractId,
  files,
  isActive,
  status,
}) => {
  const { isVendor, isProjectManager, isApprover, isViewOnly, isManager } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const documentsQueryKey = useUserQueryKey(["msa-documents", contractId]);

  const rolePrefix = React.useMemo(() => {
    if (isVendor || isProjectManager) return "/contract/vendor";
    if (isApprover) return "/contract/approver";
    if (isViewOnly) return "/contract/user";
    return "/contract/manager";
  }, [isApprover, isVendor, isProjectManager, isViewOnly]);

  const {
    data: documentsResponse,
    error,
    isLoading,
  } = useQuery({
    queryKey: documentsQueryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: `${rolePrefix}/msa-contracts/${contractId}`,
      });
      return res.data as MsaDetailsApiResponse;
    },
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
    toastErrorRef.current("MSA Documents", error as any);
  }, [error]);

  const resolvedFiles = React.useMemo(() => {
    if (Array.isArray(documentsResponse?.data?.files)) {
      return documentsResponse?.data?.files;
    }
    return files || [];
  }, [documentsResponse?.data?.files, files]);

  const effectiveDate =
    documentsResponse?.data?.startDate || documentsResponse?.data?.createdAt;

  return (
    <TabsContent value="documents" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">Documents</h3>

        <div className="flex items-center gap-4">
          <ExportReportSheet contractId={contractId} contractType="MsaContract">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-[#E5E7EB] dark:border-slate-800 px-4 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100"
            >
              <Share2 className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </ExportReportSheet>
          {isManager && (
            <CreateMSADialog
              editingMsaId={contractId}
              initialValues={documentsResponse?.data as any}
              trigger={
                <Button
                  variant="outline"
                  className="h-10 rounded-xl border-[#E5E7EB] dark:border-slate-800 px-4 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100"
                >
                  Edit Contract
                </Button>
              }
            />
          )}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-[#F9FAFB] dark:bg-slate-800 px-4 py-3 text-sm text-[#6B7280] dark:text-slate-400">
          Loading documents...
        </div>
      )}

      <DocumentsStatsCard count={resolvedFiles.length} />

      <DocumentsList
        files={resolvedFiles}
        effectiveDate={effectiveDate}
        contractId={contractId}
        status={status ?? documentsResponse?.data?.status}
      />
    </TabsContent>
  );
};

export default Documents;
