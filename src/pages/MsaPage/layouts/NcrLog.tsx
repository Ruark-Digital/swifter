import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import type { PaginationState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import NcrStatsCards from "@/pages/ContractManagementPage/components/NcrStatsCards";
import NcrTable from "@/pages/ContractManagementPage/components/NcrTable";
import CreateNcrDialog from "@/pages/ContractManagementPage/components/CreateNcrDialog";
import type {
  ContractNcrSummary,
  ContractNcrStatsDTO,
  ManagerListNcrsQuery,
} from "@/pages/ContractManagementPage/api/contractManagerApi";
import type { ContractDetail } from "@/types";

type Props = {
  contractId: string;
  /** Parent MSA detail object — passed to `CreateNcrDialog` so the
   *  responder/assignee pickers can populate from `approvers` and
   *  `internalTeam`. Optional; dialog falls back to empty lists. */
  contract?: ContractDetail;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const NcrLog: React.FC<Props> = ({ contractId, contract, isActive, actionsDisabled }) => {
  const { isApprover, isVendor, isProjectManager, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;

  const basePath = React.useMemo(() => {
    if (isContractVendorLike)
      return `/contract/vendor/msa-contracts/${contractId}/ncrs`;
    if (isApprover) return `/contract/approver/msa-contracts/${contractId}/ncrs`;
    if (isManager) return `/contract/manager/msa-contracts/${contractId}/ncrs`;
    if (isAdmin || isViewOnly) return `/contract/user/msa-contracts/${contractId}/ncrs`;
    return `/contract/user/msa-contracts/${contractId}/ncrs`;
  }, [
    contractId,
    isAdmin,
    isApprover,
    isContractVendorLike,
    isManager,
    isViewOnly,
  ]);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const statsQueryKey = ["msaNcrs", "stats", contractId, basePath] as const;
  const listQueryKey = [
    "msaNcrs",
    contractId,
    pagination.pageIndex,
    pagination.pageSize,
    basePath,
  ] as const;

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: `${basePath}/stats` });
      return response.data as { data?: ContractNcrStatsDTO };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
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
      return response.data as { data?: ContractNcrSummary[] };
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const ncrRows = (ncrsRes?.data ?? []) as ContractNcrSummary[];
  const stats = statsRes?.data;

  return (
    <TabsContent value="ncr-log" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Non-Compliance Report
        </h3>
        {(isApprover || isContractVendorLike || isManager) && (
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

export default NcrLog;
