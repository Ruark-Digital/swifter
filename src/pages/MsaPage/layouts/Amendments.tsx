import React from "react";
import { useQuery } from "@tanstack/react-query";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import { type ApiResponseError } from "@/types";
import {
  type ContractAmendmentDTO,
  type ContractAmendmentStatsDTO,
} from "@/pages/ContractManagementPage/api/contractManagerApi";
import AmendmentsStatsCards from "@/pages/ContractManagementPage/components/AmendmentsStatsCards";
import AmendmentsTable, {
  type AmendmentRow,
} from "@/pages/ContractManagementPage/components/AmendmentsTable";
import { CreateAmendmentDialog } from "@/pages/ContractManagementPage/layouts/AmendmentsTabContent";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

type Props = {
  contractId: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const normalizeVendorStatus = (
  value?: string,
): AmendmentRow["vendorStatus"] => {
  const normalized = value?.toLowerCase();
  if (normalized === "accepted" || normalized === "approved") return "Accepted";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

const normalizeStatus = (value?: string): AmendmentRow["status"] => {
  const normalized = value?.toLowerCase();
  if (normalized === "approved" || normalized === "accepted") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Pending";
};

const Amendments: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const { isApprover, isVendor, isProjectManager, isManager, isViewOnly, isAdmin } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ list?: unknown; stats?: unknown }>({});

  const basePath = React.useMemo(() => {
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contract/${contractId}/amendment`;
    if (isApprover)
      return `/contract/approver/msa-contract/${contractId}/amendment`;
    if (isManager) return `/contract/manager/msa-contract/${contractId}/amendments`;
    if (isAdmin || isViewOnly)
      return `/contract/user/msa-contract/${contractId}/amendment`;
    return `/contract/user/msa-contract/${contractId}/amendment`;
  }, [
    contractId,
    isAdmin,
    isApprover,
    isManager,
    isProjectManager,
    isVendor,
    isViewOnly,
  ]);

  const statsBasePath = React.useMemo(() => {
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contract/${contractId}/amendment`;
    if (isApprover)
      return `/contract/approver/msa-contract/${contractId}/amendment`;
    if (isAdmin || isViewOnly)
      return `/contract/user/msa-contract/${contractId}/amendment`;
    return "";
  }, [contractId, isAdmin, isApprover, isProjectManager, isVendor, isViewOnly]);

  const statsQueryKey = useUserQueryKey([
    "msa-amendments-stats",
    contractId,
    statsBasePath,
  ]);
  const amendmentsQueryKey = useUserQueryKey([
    "msa-amendments",
    contractId,
    basePath,
  ]);

  const {
    data: amendmentsRes,
    isLoading: isAmendmentsLoading,
    error: listError,
  } = useQuery({
    queryKey: amendmentsQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: basePath });
      return res.data as
        | { message?: string; data?: ContractAmendmentDTO[] | { data?: ContractAmendmentDTO[] } }
        | ContractAmendmentDTO[];
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const {
    data: statsRes,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: `${statsBasePath}/stats` });
      return res.data as
        | { message?: string; data?: ContractAmendmentStatsDTO }
        | ContractAmendmentStatsDTO;
    },
    enabled: Boolean(contractId) && !!isActive && !isManager,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA Amendments", listError as ApiResponseError);
  }, [listError]);

  React.useEffect(() => {
    if (!statsError) return;
    if (lastErrorRef.current.stats === statsError) return;
    lastErrorRef.current.stats = statsError;
    toastErrorRef.current("MSA Amendments Stats", statsError as ApiResponseError);
  }, [statsError]);

  const amendments = React.useMemo<ContractAmendmentDTO[]>(() => {
    if (Array.isArray(amendmentsRes)) return amendmentsRes;
    if (Array.isArray(amendmentsRes?.data)) return amendmentsRes.data;
    if (Array.isArray((amendmentsRes as any)?.data?.data))
      return (amendmentsRes as any).data.data;
    return [];
  }, [amendmentsRes]);

  const amendmentsRows = React.useMemo<AmendmentRow[]>(() => {
    return amendments.map((amendment, index) => ({
      id: amendment._id || amendment.amendmentId || "",
      amendmentId: amendment.amendmentId || amendment._id || `AM-${index + 1}`,
      amendmentTitle: amendment.title || amendment.amendmentTitle || "-",
      vendorStatus: normalizeVendorStatus(amendment.vendorStatus),
      status: normalizeStatus(amendment.status),
    }));
  }, [amendments]);

  const derivedManagerStats = React.useMemo<ContractAmendmentStatsDTO>(() => {
    const all = amendmentsRows.length;
    const accepted = amendmentsRows.filter((row) => row.status === "Approved").length;
    const rejected = amendmentsRows.filter((row) => row.status === "Rejected").length;
    const pending = Math.max(0, all - accepted - rejected);
    return { all, accepted, rejected, pending };
  }, [amendmentsRows]);

  const resolvedStats = React.useMemo<ContractAmendmentStatsDTO | undefined>(() => {
    if (isManager) return derivedManagerStats;
    if ((statsRes as any)?.data) return (statsRes as any).data;
    return statsRes as ContractAmendmentStatsDTO | undefined;
  }, [derivedManagerStats, isManager, statsRes]);

  return (
    <TabsContent value="amendments" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">Amendments</h3>
        <div className="flex items-center gap-4">
          <ExportReportSheet contractId={contractId} contractType="MsaContract">
            <Button
              variant="outline"
              className="rounded-xl border-[#E5E7EB] dark:border-slate-800 px-4 font-semibold text-[#0F0F0F] dark:text-slate-100"
            >
              <img
                src="/assets/contract-management/amendments/share.svg"
                className="mr-2 h-5 w-5"
              />
              Export Report
            </Button>
          </ExportReportSheet>

          {isManager && (
            <CreateAmendmentDialog
              contractId={contractId}
              createPath={`/contract/manager/msa-contract/${contractId}/amendments`}
              mutationScope="msa-amendments"
              listInvalidateQueryKey={amendmentsQueryKey}
              statsInvalidateQueryKey={statsQueryKey}
              trigger={
                <Button
                  className="rounded-xl bg-[#2A4467] px-4 font-semibold text-white hover:bg-[#2A4467]/90"
                  disabled={!!actionsDisabled}
                >
                  <img
                    src="/assets/contract-management/amendments/plus.svg"
                    className="mr-2 h-5 w-5"
                  />
                  Create Amendment
                </Button>
              }
            />
          )}
        </div>
      </div>

      <AmendmentsStatsCards stats={resolvedStats} isLoading={isStatsLoading} />

      <AmendmentsTable
        rows={amendmentsRows}
        isLoading={isAmendmentsLoading}
        contractId={contractId}
        basePath={basePath}
        listInvalidateQueryKey={amendmentsQueryKey}
        statsInvalidateQueryKey={statsQueryKey}
      />
    </TabsContent>
  );
};

export default Amendments;
