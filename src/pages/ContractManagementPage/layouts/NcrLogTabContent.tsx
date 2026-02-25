import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import type { PaginationState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import NcrStatsCards from "../components/NcrStatsCards";
import NcrTable from "../components/NcrTable";
import {
  contractManagerApi,
  type ManagerListNcrsQuery,
} from "../api/contractManagerApi";
import { approverApi } from "../api/approverApi";
import { useUserRole } from "@/hooks/useUserRole";
import CreateNcrDialog from "../components/CreateNcrDialog";
import type { ContractDetail } from "@/types";

type Props = {
  contractId: string;
  contract: ContractDetail
};

const NcrLogTabContent: React.FC<Props> = ({ contractId, contract }) => {
  const { isApprover } = useUserRole();
  const api = isApprover ? approverApi : contractManagerApi;
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: [
      isApprover ? "approver" : "contractManager",
      "contractNcrs",
      "stats",
      contractId,
    ],
    queryFn: async () => await api.getNcrStats(contractId),
    enabled: Boolean(contractId),
  });

  const { data: ncrsRes, isLoading: isNcrsLoading } = useQuery({
    queryKey: [
      isApprover ? "approver" : "contractManager",
      "contractNcrs",
      contractId,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const query: ManagerListNcrsQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };
      return await api.listNcrs(contractId, query);
    },
    enabled: Boolean(contractId),
  });

  const ncrRows = ncrsRes?.data ?? [];
  const stats = statsRes?.data;

  return (
    <TabsContent value="ncr-log" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">
          Non-Compliance Report
        </h3>
        {isApprover && (
          <CreateNcrDialog
            contractId={contractId}
            contract={contract}
            trigger={
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#2A4467] px-4 text-sm font-semibold text-white"
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
      />
    </TabsContent>
  );
};

export default NcrLogTabContent;
