import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import ClaimsStatsCards from "../components/ClaimsStatsCards";
import ClaimsTable from "../components/ClaimsTable";
import RequestClaimDialog from "../components/RequestClaimDialog";
import { useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { contractManagerApi, type ManagerListClaimsQuery } from "../api/contractManagerApi";
import { useUserRole } from "@/hooks/useUserRole";
import { approverApi } from "../api/approverApi";

type Props = {
  contractId: string;
  isActive?: boolean;
};

const ClaimsTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const { isApprover } = useUserRole();
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: [
      isApprover ? "approver" : "contractManager",
      "contractClaims",
      "stats",
      contractId,
    ],
    queryFn: async () => {
      if (isApprover) {
        return await approverApi.getClaimStats(contractId);
      }
      return await contractManagerApi.getClaimStats(contractId);
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const { data: claimsRes, isLoading: isClaimsLoading } = useQuery({
    queryKey: [
      isApprover ? "approver" : "contractManager",
      "contractClaims",
      contractId,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const query: ManagerListClaimsQuery = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      };
      if (isApprover) {
        return await approverApi.listClaims(contractId, query);
      }
      return await contractManagerApi.listClaims(contractId, query);
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const claimRows = claimsRes?.data?.changes ?? [];
  const totalCount = claimsRes?.data?.total ?? claimRows.length;

  return (
    <TabsContent value="claims" className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#1F2937]">Claims</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-10 rounded-xl border-[#E5E7EB] bg-white px-4 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB]"
          >
            <Share2 className="mr-2 h-4 w-4" /> Export Report
          </Button>
          {!isApprover && (
            <RequestClaimDialog
              trigger={
                <Button className="h-10 rounded-xl bg-[#2A4467] px-4 text-sm font-medium text-white hover:bg-[#1f3552]">
                  Create Claim
                </Button>
              }
            />
          )}
        </div>
      </div>

      <ClaimsStatsCards stats={statsRes?.data} isLoading={isStatsLoading} />

      <ClaimsTable
        rows={claimRows}
        isLoading={isClaimsLoading}
        totalCount={totalCount}
        pagination={pagination}
        setPagination={setPagination}
      />
    </TabsContent>
  );
};

export default ClaimsTabContent;
