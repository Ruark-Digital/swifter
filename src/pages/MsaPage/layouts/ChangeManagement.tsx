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

  const rolePrefix = React.useMemo(() => {
    if (isManager) return `/contract/manager/msa-contracts/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contracts/${contractId}`;
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contracts/${contractId}`;
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
    if (Array.isArray(payload?.changes)) return payload.changes;
    if (Array.isArray(payload?.contractChanges)) return payload.contractChanges;
    if (Array.isArray(payload?.data?.changes)) return payload.data.changes;
    return [];
  }, [changesRes?.data?.data]);
  const totalCount = changesRes?.data?.data?.total ?? rows.length;

  const stats = statsRes?.data;
  const canCreateChange = isManager || isProjectManager || isVendor;

  return (
    <MainTabsContent value="change" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Change Management
        </h3>
        <div className="flex items-center gap-4">
          <ExportReportSheet contractId={contractId} contractType="MsaContract">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-[#E5E7EB] px-4 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </ExportReportSheet>
          {canCreateChange && (
            <CreateChangeDialog
              trigger={
                <Button
                  className="h-10 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 px-4 text-sm font-semibold text-[#0F0F0F] dark:text-slate-100 hover:bg-[#E5E7EB]"
                  disabled={!!actionsDisabled}
                >
                  Create Change
                </Button>
              }
              contractId={contractId}
              isManager={isManager || isAdmin}
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
        className="space-y-4"
      >
        <TabsList className="h-auto rounded-full bg-[#F3F4F6] dark:bg-slate-800 p-1">
          <TabsTrigger
            value="all"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            All Changes
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Requests
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Orders
          </TabsTrigger>
          <TabsTrigger
            value="directive"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Directive
          </TabsTrigger>
          <TabsTrigger
            value="proposal"
            className="rounded-full px-6 py-2 text-sm font-semibold data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
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
          />
        </TabsContent>
      </Tabs>
    </MainTabsContent>
  );
};

export default ChangeManagement;
