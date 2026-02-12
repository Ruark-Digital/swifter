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

type Props = {
  contractId: string;
};

const NcrLogTabContent: React.FC<Props> = ({ contractId }) => {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ["contractManager", "contractNcrs", "stats", contractId],
    queryFn: async () => await contractManagerApi.getNcrStats(contractId),
    enabled: Boolean(contractId),
  });

  const { data: ncrsRes, isLoading: isNcrsLoading } = useQuery({
    queryKey: [
      "contractManager",
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
      return await contractManagerApi.listNcrs(contractId, query);
    },
    enabled: Boolean(contractId),
  });

  const ncrRows = ncrsRes?.data ?? [];
  const stats = statsRes?.data;

  return (
    <TabsContent value="ncr-log" className="space-y-6">
      <h3 className="text-base font-semibold text-slate-900">
        Non-Compliance Report
      </h3>

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

