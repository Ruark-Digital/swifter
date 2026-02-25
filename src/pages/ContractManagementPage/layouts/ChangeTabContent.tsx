import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import ChangeStatsCards from "../components/ChangeStatsCards";
import ChangeTable from "../components/ChangeTable";
import CreateChangeDialog from "../components/CreateChangeDialog";
import { useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import {
  contractManagerApi,
  type ManagerListChangesQuery,
} from "../api/contractManagerApi";
import {
  changeTabToApiType,
  type ChangeTabValue,
} from "@/pages/ContractManagementPage/lib/contractChanges";
import { useUserRole } from "@/hooks/useUserRole";
import { vendorApi } from "../api/vendorApi";
import { approverApi } from "../api/approverApi";

type Props = {
  contractId: string;
};

const ChangeTabContent: React.FC<Props> = ({ contractId }) => {
  const { isVendor, isManager, isApprover } = useUserRole();
  const [activeTab, setActiveTab] = React.useState<ChangeTabValue>("all");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: [
      isManager ? "contractManager" : isVendor ? "vendor" : "approver",
      "contractChanges",
      "stats",
      contractId,
    ],
    queryFn: async () => {
      if (isManager) {
        return await contractManagerApi.getChangeStats(contractId);
      }
      if (isVendor) {
        return await vendorApi.getChangeStats(contractId);
      }
      return await approverApi.getChangeStats(contractId);
    },
    enabled: Boolean(contractId),
    staleTime: 60000,
  });

  const { data: changesRes, isLoading: isChangesLoading } = useQuery({
    queryKey: [
      isManager ? "contractManager" : isVendor ? "vendor" : "approver",
      "contractChanges",
      contractId,
      activeTab,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const type = changeTabToApiType(activeTab);
      const baseQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      } as ManagerListChangesQuery;
      if (type) {
        baseQuery.type = type;
      }
      if (isManager) {
        return await contractManagerApi.listChanges(contractId, baseQuery);
      }
      if (isVendor) {
        return await vendorApi.listChanges(contractId, baseQuery);
      }
      return await approverApi.listChanges(contractId, baseQuery);
    },
    enabled: Boolean(contractId),
    staleTime: 60000,
  });

  const changeRows = (changesRes)?.data?.data?.changes ?? [];
  const totalCount = (changesRes)?.data?.data?.total ?? changeRows.length;

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
                <Button className="h-10 rounded-xl bg-[#F3F4F6] px-4 text-sm font-medium text-[#111827] hover:bg-[#E5E7EB]">
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
        return <ChangeStatsCards stats={stats} isLoading={isStatsLoading} variant={isApprover ? "approver" : "manager"} />;
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
            variant={isApprover ? "approver" : "manager"}
            rows={changeRows}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="requests">
          <ChangeTable
            variant={isApprover ? "approver" : "manager"}
            rows={changeRows.filter((row: any) => row.type === "request")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="orders">
          <ChangeTable
            rows={changeRows.filter((row: any) => row.type === "order")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="directive">
          <ChangeTable
            rows={changeRows.filter((row: any) => row.type === "directive")}
            isLoading={isChangesLoading}
            totalCount={totalCount}
            pagination={pagination}
            setPagination={setPagination}
          />
        </TabsContent>
        <TabsContent value="proposal">
          <ChangeTable
            variant={isApprover ? "approver" : "manager"}
            rows={changeRows.filter((row: any) => row.type === "proposal")}
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
