import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { PaginationState } from "@tanstack/react-table";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useToastHandler } from "@/hooks/useToaster";
import { getRequest } from "@/lib/axiosInstance";
import type { ApiResponseError } from "@/types";
import type {
  ContractClaimDTO,
  ContractClaimStatsDTO,
} from "@/pages/ContractManagementPage/api/contractManagerApi";
import ClaimsStatsCards from "@/pages/ContractManagementPage/components/ClaimsStatsCards";
import ClaimsTable from "@/pages/ContractManagementPage/components/ClaimsTable";
import RequestClaimDialog from "@/pages/ContractManagementPage/components/RequestClaimDialog";
import { ExportReportSheet } from "@/components/layouts/ExportReportSheet";

type Props = {
  contractId: string;
  isActive?: boolean;
  actionsDisabled?: boolean;
};

const Claims: React.FC<Props> = ({ contractId, isActive, actionsDisabled }) => {
  const {
    isManager,
    isApprover,
    isVendor,
    isProjectManager,
    isViewOnly,
  } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<{ stats?: unknown; claims?: unknown }>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const basePath = React.useMemo(() => {
    if (isManager)
      return `/contract/manager/msa-contracts/${contractId}`;
    if (isApprover) return `/contract/approver/msa-contracts/${contractId}`;
    if (isVendor || isProjectManager)
      return `/contract/vendor/msa-contracts/${contractId}`;
    if (isViewOnly) return `/contract/user/msa-contracts/${contractId}`;
    return `/contract/user/msa-contracts/${contractId}`;
  }, [
    contractId,
    isApprover,
    isManager,
    isVendor,
    isProjectManager,
    isViewOnly,
  ]);

  // BE expects plural `claims` for every role (singular `claim` 404s,
  // e.g. vendor `/msa-contracts/{id}/claim`). Matches contract surface.
  const claimsPath = `${basePath}/claims`;
  const statsPath = `${claimsPath}/stats`;

  const createPath = React.useMemo(() => {
    if (isVendor || isProjectManager || isManager) return `${basePath}/claims`;
    return undefined;
  }, [basePath, isVendor, isProjectManager, isManager]);

  const claimsQueryKey = [
    "msa-claims",
    contractId,
    pagination.pageIndex,
    pagination.pageSize,
    claimsPath,
  ];
  const statsQueryKey = [
    "msa-claims",
    "stats",
    contractId,
    statsPath,
  ];

  const {
    data: statsRes,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: statsQueryKey,
    queryFn: async () => {
      const response = await getRequest({ url: statsPath });
      return response.data as { data?: ContractClaimStatsDTO };
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const {
    data: claimsRes,
    isLoading: isClaimsLoading,
    error: claimsError,
  } = useQuery({
    queryKey: claimsQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(pagination.pageIndex + 1));
      params.append("limit", String(pagination.pageSize));
      const response = await getRequest({
        url: `${claimsPath}?${params.toString()}`,
      });
      return response.data as {
        data?: {
          changes?: ContractClaimDTO[];
          contractClaims?: ContractClaimDTO[];
          claims?: ContractClaimDTO[];
          total?: number;
        };
      };
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
    toastErrorRef.current("MSA Claims Stats", statsError as ApiResponseError);
  }, [statsError]);

  React.useEffect(() => {
    if (!claimsError) return;
    if (lastErrorRef.current.claims === claimsError) return;
    lastErrorRef.current.claims = claimsError;
    toastErrorRef.current("MSA Claims", claimsError as ApiResponseError);
  }, [claimsError]);

  const rows = React.useMemo(() => {
    const payload = claimsRes?.data;
    // BE returns claims under `changes` (claims endpoint reuses the
    // change-order list shape — same as the contract surface). Keep the
    // older keys as defensive fallbacks.
    if (Array.isArray(payload?.changes)) return payload.changes;
    if (Array.isArray(payload?.contractClaims)) return payload.contractClaims;
    if (Array.isArray(payload?.claims)) return payload.claims;
    return [];
  }, [claimsRes?.data]);
  const totalCount = claimsRes?.data?.total ?? rows.length;

  // Manager Send-for-Approval (time-impact claims) needs the MSA-specific
  // approver-assign URL. Plural `msa-contracts` + plural `claims` for
  // manager per BE spec — see msa-contracts-plural-invoice-approve-quirk
  // (third family) and msa-url-routing-bug-classes Class 4.
  const claimAssignUrlBuilder = React.useCallback(
    (claimId: string) =>
      `/contract/manager/msa-contracts/${contractId}/claims/${claimId}/approvers`,
    [contractId],
  );

  return (
    <TabsContent value="claims" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold leading-[36px] tracking-[-0.02em] text-[#0F0F0F] dark:text-slate-100">
          Claims
        </h3>
        <div className="flex items-center gap-4">
          <ExportReportSheet contractId={contractId} contractType="MsaContract">
            <Button
              variant="outline"
              className="h-12 rounded-xl border-[#E5E7EB] px-5 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Export Report
            </Button>
          </ExportReportSheet>
          {createPath && (
            <RequestClaimDialog
              createPath={createPath}
              invalidateQueryKey={["msa-claims"]}
              trigger={
                <Button
                  className="h-12 rounded-xl bg-[#2A4467] px-5 text-base font-semibold text-white hover:bg-[#2A4467]/90"
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
        basePath={claimsPath}
        rows={rows}
        isLoading={isClaimsLoading}
        totalCount={totalCount}
        pagination={pagination}
        setPagination={setPagination}
        listInvalidateQueryKey={["msa-claims"]}
        claimAssignUrlBuilder={claimAssignUrlBuilder}
      />
    </TabsContent>
  );
};

export default Claims;
