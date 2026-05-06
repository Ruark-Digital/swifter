import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import ClaimsStatsCards from "../components/ClaimsStatsCards";
import ClaimsTable from "../components/ClaimsTable";
import RequestClaimDialog from "../components/RequestClaimDialog";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import type { PaginationState } from "@tanstack/react-table";
import { type ManagerListClaimsQuery } from "../api/contractManagerApi";
import { useUserRole } from "@/hooks/useUserRole";

type Props = {
  contractId: string;
  currency?: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const ClaimsTabContent: React.FC<Props> = ({
  contractId,
  isActive,
  actionsDisabled,
}) => {
  const { isApprover, isVendor, isProjectManager, isManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const getBasePath = () => {
    if (isContractVendorLike) return `/contract/vendor/contracts/${contractId}/claim`;
    if (isApprover) return `/contract/approver/contracts/${contractId}/claim`;
    if (isManager) return `/contract/manager/contracts/${contractId}/claims`;
    if (isAdmin || isViewOnly)
      return `/contract/user/contracts/${contractId}/claim`;
    return `/contract/user/contracts/${contractId}/claim`; // Default fallback
  };

  const basePath = getBasePath();

  const { data: statsRes, isLoading: isStatsLoading } = useQuery({
    queryKey: ["contractClaims", "stats", contractId, basePath],
    queryFn: async () => {
      const response = await getRequest({
        url: `${basePath}/stats`,
      });
      return response.data;
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const { data: claimsRes, isLoading: isClaimsLoading } = useQuery({
    queryKey: [
      "contractClaims",
      contractId,
      pagination.pageIndex,
      pagination.pageSize,
      basePath,
    ],
    queryFn: async () => {
      const query: ManagerListClaimsQuery = {
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

          {(isContractVendorLike || isManager) && (
            <RequestClaimDialog
              createPath={basePath}
              invalidateQueryKey={["contractClaims", contractId, basePath]}
              trigger={
                <Button
                  className="h-10 rounded-xl bg-[#2A4467] px-4 text-sm font-medium text-white hover:bg-[#1f3552]"
                  disabled={!!actionsDisabled}
                >
                  Create Claim
                </Button>
              }
            />
          )}
        </div>
      </div>

      <ClaimsStatsCards stats={statsRes?.data} isLoading={isStatsLoading} />

      <ClaimsTable
        contractId={contractId}
        basePath={basePath}
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
