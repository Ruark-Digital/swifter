import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import type { PaginationState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import NcrStatsCards from "../components/NcrStatsCards";
import NcrTable from "../components/NcrTable";
import {
  type ManagerListNcrsQuery,
} from "../api/contractManagerApi";
import { useUserRole } from "@/hooks/useUserRole";
import CreateNcrDialog from "../components/CreateNcrDialog";
import type { ContractDetail } from "@/types";
import { getRequest } from "@/lib/axiosInstance";

type Props = {
  contractId: string;
  contract: ContractDetail
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const NcrLogTabContent: React.FC<Props> = ({ contractId, contract, isActive, actionsDisabled }) => {
  const { isApprover, isVendor, isProjectManager, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  
  const getBasePath = () => {
    if (isContractVendorLike) return `/contract/vendor/contracts/${contractId}/ncrs`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/ncrs`;
    if (isManager) return `/contract/manager/contracts/${contractId}/ncrs`;
    if (isAdmin || isViewOnly) return `/contract/user/contracts/${contractId}/ncrs`;
    return `/contract/user/contracts/${contractId}/ncrs`; // Default fallback
  };

  const basePath = getBasePath();

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const statsQueryKey = ["contractNcrs", "stats", contractId, basePath] as const;
  const listQueryKey = [
    "contractNcrs",
    contractId,
    pagination.pageIndex,
    pagination.pageSize,
    basePath,
  ] as const;

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/stats`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const { data: ncrsRes, isLoading: isNcrsLoading } = useQuery({
    queryKey: listQueryKey,
    queryFn: async () => {
      const query: ManagerListNcrsQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };
      const params = new URLSearchParams();
      if (query.page) params.append("page", String(query.page));
      if (query.limit) params.append("limit", String(query.limit));
      
      const response = await getRequest({
        url: `${basePath}?${params.toString()}`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const ncrRows = ncrsRes?.data ?? [];
  const stats = statsRes?.data;

  return (
    <TabsContent value="ncr-log" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Non-Compliance Report
        </h3>
        {(isApprover || isContractVendorLike) && (
          <CreateNcrDialog
            contractId={contractId}
            contract={contract}
            basePath={basePath}
            listInvalidateQueryKey={listQueryKey}
            statsInvalidateQueryKey={statsQueryKey}
            trigger={
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2A4467] px-4 text-sm font-semibold text-white"
                disabled={!!actionsDisabled}
              >
                Create NCR
              </button>
            }
          />
        )}
      </div>

      <NcrStatsCards
        all={stats?.total}
        issued={stats?.issue}
        received={stats?.receive}
        isLoading={isStatsLoading}
      />

      <NcrTable
        rows={ncrRows}
        isLoading={isNcrsLoading}
        totalCount={ncrRows.length}
        pagination={pagination}
        setPagination={setPagination}
        contractId={contractId}
        basePath={basePath}
        listInvalidateQueryKey={listQueryKey}
        statsInvalidateQueryKey={statsQueryKey}
      />
    </TabsContent>
  );
};

export default NcrLogTabContent;
