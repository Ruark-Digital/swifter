import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent as MainTabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import type { PaginationState } from "@tanstack/react-table";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ApiResponseError } from "@/types";
import ChangeStatsCards from "@/pages/ContractManagementPage/components/ChangeStatsCards";
import CreateChangeDialog from "@/pages/ContractManagementPage/components/CreateChangeDialog";
import ChangeTable from "@/pages/ContractManagementPage/components/ChangeTable";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";
import {
  changeTabToApiType,
  type ChangeTabValue,
} from "@/pages/ContractManagementPage/lib/contractChanges";
import type {
  ContractChangeDTO,
  ContractChangeStatsDTO,
} from "@/pages/ContractManagementPage/api/contractManagerApi";

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
  /** Is the logged-in manager the MSA's owner. Gates the manager-side Create
   *  Change action, and the change sheet only gives the owner Approve/Reject. */
  owner?: boolean;
};

type ChangesDataResponse = {
  changes?: ContractChangeDTO[];
  total?: number;
};

const ChangeManagement: React.FC<Props> = ({
  contractId,
  currency,
  isActive,
  actionsDisabled,
  owner,
}) => {
  const { isManager, isApprover, isAdmin, isViewOnly, isVendor, isProjectManager } =
    useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; list?: unknown }>({});
  const [activeTab, setActiveTab] = React.useState<ChangeTabValue>("all");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Same role order as the contract Change tab (ChangeTabContent).
  const rolePrefix = React.useMemo(() => {
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contracts/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contracts/${contractId}`;
    // QA #298: company/super admins read via the manager (org-scoped) endpoint;
    // the /contract/user endpoint is participant-scoped and empty for admins.
    if (isManager || isAdmin) return `/contract/manager/msa-contracts/${contractId}`;
    if (isViewOnly) return `/contract/user/msa-contracts/${contractId}`;
    return `/contract/user/msa-contracts/${contractId}`;
  }, [
    contractId,
    isAdmin,
    isApprover,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  const listBasePath = React.useMemo(() => `${rolePrefix}/changes`, [rolePrefix]);

  const statsQueryKey = [
    "msaChanges",
    "stats",
    contractId,
    rolePrefix,
  ];
  const listQueryKey = [
    "msaChanges",
    contractId,
    activeTab,
    pagination.pageIndex,
    pagination.pageSize,
    rolePrefix,
  ];

  const { data: statsRes, isLoading: isStatsLoading, error: statsError } =
    useQuery({
      queryKey: statsQueryKey,
      queryFn: async () => {
        const response = await getRequest({ url: `${listBasePath}/stats` });
        return response.data as { data?: ContractChangeStatsDTO };
      },
      enabled: Boolean(contractId) && !!isActive,
      staleTime: 60000,
      retry: false,
    });

  const { data: changesRes, isLoading: isChangesLoading, error: listError } =
    useQuery({
      queryKey: listQueryKey,
      queryFn: async () => {
        const type = changeTabToApiType(activeTab);
        const params = new URLSearchParams();
        params.append("page", String(pagination.pageIndex + 1));
        params.append("limit", String(pagination.pageSize));
        if (type) params.append("type", type);
        const response = await getRequest({
          url: `${listBasePath}?${params.toString()}`,
        });
        return response as ApiResponse<ChangesDataResponse>;
      },
      enabled: Boolean(contractId) && !!isActive,
      staleTime: 60000,
      retry: false,
    });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!statsError) return;
    if (lastErrorRef.current.stats === statsError) return;
    lastErrorRef.current.stats = statsError;
    toastErrorRef.current("MSA Change Stats", statsError as ApiResponseError);
  }, [statsError]);

  React.useEffect(() => {
    if (!listError) return;
    if (lastErrorRef.current.list === listError) return;
    lastErrorRef.current.list = listError;
    toastErrorRef.current("MSA Changes", listError as ApiResponseError);
  }, [listError]);

  const rows = React.useMemo<ContractChangeDTO[]>(() => {
    const payload = changesRes?.data?.data as any;
    const list: any[] = Array.isArray(payload?.changes)
      ? payload.changes
      : Array.isArray(payload?.contractChanges)
        ? payload.contractChanges
        : Array.isArray(payload?.data?.changes)
          ? payload.data.changes
          : [];
    // Same row shaping as the contract Change tab: "Submitted" column (QA #246)
    // falls back to createdAt when the BE omits submittedAt.
    return list.map((change) => ({
      ...change,
      proposalCategory: change.changeRefModel,
      submittedAt: change.submittedAt ?? change.createdAt,
    }));
  }, [changesRes?.data?.data]);
  const totalCount = changesRes?.data?.data?.total ?? rows.length;

  const stats = statsRes?.data;
  // Same gate as the contract Change tab: the owning manager or a PM.
  const canCreateChange = (isManager && Boolean(owner)) || isProjectManager;

  return (
    <MainTabsContent value="change" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-[#1F2937] dark:text-slate-100">
          Change Management
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <ExportReportSheet contractId={contractId} contractType="MsaContract">
            <Button
              variant="outline"
              className="h-10 w-full rounded-xl border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB] sm:w-auto dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Share2 className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </ExportReportSheet>
          {canCreateChange && (
            <CreateChangeDialog
              trigger={
                <Button
                  className="h-10 w-full rounded-xl bg-[#2A4467] px-4 text-sm font-semibold text-white hover:bg-[#2A4467]/90 sm:w-auto"
                  disabled={!!actionsDisabled}
                >
                  Create Change
                </Button>
              }
              contractId={contractId}
              isManager={isManager}
              documentType="MsaContract"
            />
          )}
        </div>
      </div>

      <ChangeStatsCards
        stats={stats}
        isLoading={isStatsLoading}
        variant={isApprover ? "approver" : "manager"}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as ChangeTabValue);
          setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        className="w-full bg-transparent"
      >
        <TabsList className="inline-flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#EEF1F4] p-1 mb-3">
          <TabsTrigger
            value="all"
            className="shrink-0 whitespace-nowrap rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            All Changes
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="shrink-0 whitespace-nowrap rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Requests
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="shrink-0 whitespace-nowrap rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Orders
          </TabsTrigger>
          <TabsTrigger
            value="directive"
            className="shrink-0 whitespace-nowrap rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Directive
          </TabsTrigger>
          <TabsTrigger
            value="proposal"
            className="shrink-0 whitespace-nowrap rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Proposal
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <ChangeTable
            contractId={contractId}
            currency={currency}
            basePath={listBasePath}
            rows={rows}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
            variant={isApprover ? "approver" : "manager"}
            listInvalidateQueryKey={listQueryKey}
            statsInvalidateQueryKey={statsQueryKey}
            owner={owner}
          />
        </TabsContent>
      </Tabs>
    </MainTabsContent>
  );
};

export default ChangeManagement;
