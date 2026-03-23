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
  type ManagerListChangesQuery,
} from "../api/contractManagerApi";
import {
  changeTabToApiType,
  type ChangeTabValue,
} from "@/pages/ContractManagementPage/lib/contractChanges";
import { useUserRole } from "@/hooks/useUserRole";
import { ApiResponse } from "@/types";

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
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const ChangeTabContent: React.FC<Props> = ({
  contractId,
  isActive,
  actionsDisabled,
}) => {
  const { isVendor, isManager, isApprover, isAdmin, isViewOnly } = useUserRole();
  const [activeTab, setActiveTab] = React.useState<ChangeTabValue>("all");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const getBasePath = () => {
    if (isVendor) return `/contract/vendor/contracts/${contractId}/change`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/change`;
    if (isManager) return `/contract/manager/contracts/${contractId}/changes`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/change`;
    return `/contract/user/contracts/${contractId}/change`; // Default fallback
  };

  const basePath = getBasePath();

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: [
      "contractChanges",
      "stats",
      contractId,
      basePath
    ],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/stats`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
  });

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
  }));

  return (
    <TabsContent value="change" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1F2937]">
          Change Management
        </h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-xl border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB]"
          >
            <Share2 className="mr-2 h-4 w-4" /> Export Report
          </Button>
          {(isManager || isVendor) && (
            <CreateChangeDialog
              trigger={
                <Button
                  className="h-10 rounded-xl bg-[#F3F4F6] px-4 text-sm font-medium text-[#111827] hover:bg-[#E5E7EB]"
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

      {(() => {
        const stats = (statsRes as any)?.data?.data ?? (statsRes as any)?.data;
        return (
          <ChangeStatsCards
            stats={stats}
            isLoading={isStatsLoading}
            variant={isApprover ? "approver" : "manager"}
          />
        );
      })()}

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
            variant={isApprover ? "approver" : "manager"}
            rows={filteredRows}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="requests">
          <ChangeTable
            contractId={contractId}
            variant={isApprover ? "approver" : "manager"}
            rows={filteredRows.filter((row) => row.type === "request")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="orders">
          <ChangeTable
            contractId={contractId}
            rows={filteredRows.filter((row) => row.type === "order")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="directive">
          <ChangeTable
            contractId={contractId}
            rows={filteredRows.filter((row) => row.type === "directive")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="proposal">
          <ChangeTable
            contractId={contractId}
            variant={isApprover ? "approver" : "manager"}
            rows={filteredRows.filter((row) => row.type === "proposal")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};

export default ChangeTabContent;
