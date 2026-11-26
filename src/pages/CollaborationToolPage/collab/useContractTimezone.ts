import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useUser } from "@/store/authSlice";
import { browserTimeZone, resolveTimeZone } from "@/lib/zonedDate";
import { vendorApi } from "@/pages/ContractManagementPage/api/vendorApi";
import { contractManagerApi } from "@/pages/ContractManagementPage/api/contractManagerApi";
import { approverApi } from "@/pages/ContractManagementPage/api/approverApi";
import { viewOnlyApi } from "@/pages/ContractManagementPage/api/viewOnlyApi";
import { companyAdminApi } from "@/pages/ContractManagementPage/api/companyAdminApi";

/**
 * The timezone the collaboration sidebar should show times in: the contract's
 * own, else the viewer's, else the browser's. Shares the contract detail page's
 * query key so an already-open contract costs no extra request. An MSA document
 * reads the MSA's own timezone (sharing the MSA detail page's query key). Without
 * either id it falls back to the viewer's zone.
 */
export function useContractTimezone(
  contractId: string | undefined,
  msaId?: string,
): string {
  const isMsa = Boolean(msaId);
  const role = useUserRole();
  const user = useUser();
  const queryKey = useUserQueryKey(["contract-manager-contracts", contractId]);
  const { data } = useQuery({
    queryKey,
    enabled: Boolean(contractId) && !isMsa,
    staleTime: 60_000,
    retry: false,
    queryFn: () => {
      const id = contractId ?? "";
      if (role.isVendor || role.isProjectManager) return vendorApi.getContract(id);
      if (role.isApprover) return approverApi.getContract(id);
      if (role.isCompanyAdmin) return companyAdminApi.getContract(id);
      if (role.isViewOnly) return viewOnlyApi.getContract(id);
      return contractManagerApi.getContract(id);
    },
  });
  const msaKey = useUserQueryKey(["msa-contracts-detail", msaId]);
  const { data: msaData } = useQuery({
    queryKey: msaKey,
    enabled: isMsa,
    staleTime: 60_000,
    retry: false,
    queryFn: () => {
      const base =
        role.isVendor || role.isProjectManager
          ? "/contract/vendor"
          : role.isApprover
            ? "/contract/approver"
            : role.isViewOnly
              ? "/contract/user"
              : "/contract/manager";
      return getRequest({ url: `${base}/msa-contracts/${msaId ?? ""}` });
    },
  });
  type Wrapped = { data?: { data?: { timezone?: string } } } | undefined;
  const contractTz =
    ((isMsa ? msaData : data) as Wrapped)?.data?.data?.timezone;
  return (
    resolveTimeZone(contractTz) ??
    resolveTimeZone(user?.timezone) ??
    browserTimeZone()
  );
}
