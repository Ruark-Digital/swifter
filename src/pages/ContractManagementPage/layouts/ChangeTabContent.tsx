import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import ChangeStatsCards from "../components/ChangeStatsCards";
import ChangeTable from "../components/ChangeTable";
import CreateChangeDialog from "../components/CreateChangeDialog";
import { useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { getRequest } from "@/lib/axiosInstance";
import {
  ContractChangeDTO,
  type ContractChangeStatsDTO,
  type ManagerListChangesQuery,
} from "../api/contractManagerApi";
import {
  changeTabToApiType,
  type ChangeTabValue,
} from "@/pages/ContractManagementPage/lib/contractChanges";
import { useUserRole } from "@/hooks/useUserRole";
import { ApiResponse } from "@/types";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

export interface ChangesDataResponse {
  changes: Change[];
  total:   number;
}

export interface Change {
  manager:        Manager;
  _id:            string;
  company:        string;
  changeRef:      ChangeRef;
  changeRefModel: string;
  requestedBy:    string;
  description:    string;
  title:          string;
  urgency:        string;
  status:         string;
  type:           string;
  files:          File[];
  changeId:       string;
  approvers:      any[];
  createdAt:      Date;
  updatedAt:      Date;
  __v:            number;
}

export interface ChangeRef {
  _id:           string;
  contractId:    string;
  contractValue: number;
}

export interface File {
  name:       string;
  url:        string;
  type:       string;
  size:       number;
  _id:        string;
  uploadedAt: Date;
}

export interface Manager {
  status: string;
}


type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
  /** BE-computed flag: is the logged-in user the contract's owner. Gates the
   *  manager-side Create Change action (vendor/PM keep their own flow). */
  owner?: boolean;
};

const ChangeTabContent: React.FC<Props> = ({
  contractId,
  currency,
  isActive,
  actionsDisabled,
  owner,
}) => {
  const { isVendor, isProjectManager, isManager, isApprover, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const [activeTab, setActiveTab] = React.useState<ChangeTabValue>("all");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const getBasePath = () => {
    if (isContractVendorLike) return `/contract/vendor/contracts/${contractId}/changes`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/changes`;
    if (isManager) return `/contract/manager/contracts/${contractId}/changes`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/changes`;
    return `/contract/user/contracts/${contractId}/changes`; // Default fallback
  };

  const basePath = getBasePath();

  const statsQueryKey = ["contractChanges", "stats", contractId, basePath] as const;
  const listQueryKey = ["contractChanges", contractId] as const;

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: `${basePath}/stats` });
      // Server envelope: { status, message, data: {...} }. Axios already
      // strips one level so `response.data` is the server body. Strip the
      // inner `.data` here so the queryFn returns the stats object
      // directly — avoids ambiguous unwrap at the call site.
      const body = response?.data as
        | { data?: ContractChangeStatsDTO }
        | ContractChangeStatsDTO
        | undefined;
      return (
        ((body as { data?: ContractChangeStatsDTO })?.data ??
          (body as ContractChangeStatsDTO) ??
          {}) as ContractChangeStatsDTO
      );
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
  });

  // Reused by all 5 <ChangeTable> instances below — see comments inside
  // ChangeDetailsSheet for the trap class this closes (memory
  // [[feedback-shared-component-hidden-invalidation-keys]]).
  const tableInvalidationProps = {
    listInvalidateQueryKey: listQueryKey,
    statsInvalidateQueryKey: statsQueryKey,
  } as const;

  const { data: changesRes, isLoading: isChangesLoading } = useQuery({
    queryKey: [
      "contractChanges",
      contractId,
      activeTab,
      pagination.pageIndex,
      pagination.pageSize,
      basePath
    ],
    queryFn: async () => {
      const type = changeTabToApiType(activeTab);
      const query = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      } as ManagerListChangesQuery;
      
      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.limit) params.append("limit", String(query.limit));
      if (type) params.append("type", type);

      const response = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });
      return response as ApiResponse<ChangesDataResponse>;
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
  });

  const changeRows = changesRes?.data?.data?.changes ?? [];
  const totalCount = changesRes?.data?.data?.total ?? changeRows.length;

  const filteredRows: ContractChangeDTO[] = changeRows.map((change) => ({
    ...change,
    type: change.type as ContractChangeDTO['type'],
    urgency: change.urgency as ContractChangeDTO['urgency'],
    status: change.status as ContractChangeDTO['status'],
    proposalCategory: change.changeRefModel,
    // "Submitted" column (QA #246): BE change objects carry createdAt as the
    // submission time; surface it as submittedAt when the field is absent.
    submittedAt:
      (change as { submittedAt?: string }).submittedAt ??
      (change.createdAt as unknown as string),
  }));

  return (
    <TabsContent value="change" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1F2937] dark:text-slate-100">
          Change Management
        </h3>
        <div className="flex items-center gap-3">
          <ExportReportSheet contractId={contractId} contractType="Contract">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              <Share2 className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </ExportReportSheet>
          {((isManager && Boolean(owner)) || isContractVendorLike) && (
            <CreateChangeDialog
              trigger={
                <Button
                  className="h-10 rounded-xl bg-[#2A4467] px-4 text-sm font-semibold text-white hover:bg-[#2A4467]/90"
                  disabled={!!actionsDisabled}
                >
                  Create Change
                </Button>
              }
              contractId={contractId}
              isManager={isManager}
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
        <TabsList className="inline-flex w-fit items-center gap-1 rounded-full bg-[#EEF1F4] p-1 mb-3">
          <TabsTrigger
            value="all"
            className="rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            All Changes
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Requests
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Orders
          </TabsTrigger>
          <TabsTrigger
            value="directive"
            className="rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Directive
          </TabsTrigger>
          <TabsTrigger
            value="proposal"
            className="rounded-full px-5 py-4 text-sm font-medium text-[#6B6B6B] data-[state=active]:bg-[#2A4467] data-[state=active]:text-white"
          >
            Change Proposal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ChangeTable
            contractId={contractId}
            basePath={basePath}
            variant={isApprover ? "approver" : "manager"}
            rows={filteredRows}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
            currency={currency}
            {...tableInvalidationProps}
          />
        </TabsContent>
        <TabsContent value="requests">
          <ChangeTable
            contractId={contractId}
            basePath={basePath}
            variant={isApprover ? "approver" : "manager"}
            rows={filteredRows.filter((row) => row.type === "request")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
            currency={currency}
            {...tableInvalidationProps}
          />
        </TabsContent>
        <TabsContent value="orders">
          <ChangeTable
            contractId={contractId}
            basePath={basePath}
            variant={isApprover ? "approver" : "manager"}
            rows={filteredRows.filter((row) => row.type === "order")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
            currency={currency}
            {...tableInvalidationProps}
          />
        </TabsContent>
        <TabsContent value="directive">
          <ChangeTable
            contractId={contractId}
            basePath={basePath}
            rows={filteredRows.filter((row) => row.type === "directive")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
            currency={currency}
            {...tableInvalidationProps}
          />
        </TabsContent>
        <TabsContent value="proposal">
          <ChangeTable
            contractId={contractId}
            basePath={basePath}
            variant={isApprover ? "approver" : "manager"}
            rows={filteredRows.filter((row) => row.type === "proposal")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
            currency={currency}
            {...tableInvalidationProps}
          />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default ChangeTabContent;
