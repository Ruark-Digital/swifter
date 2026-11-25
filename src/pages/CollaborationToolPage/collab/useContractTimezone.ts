import { useQuery } from "@tanstack/react-query";
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
 * query key so an already-open contract costs no extra request. MSA documents
 * and callers without a contract id fall back to the viewer's zone.
 */
export function useContractTimezone(
  contractId: string | undefined,
  isMsa: boolean,
): string {
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
  const contractTz = (data as { data?: { data?: { timezone?: string } } } | undefined)
    ?.data?.data?.timezone;
  return (
    resolveTimeZone(contractTz) ??
    resolveTimeZone(user?.timezone) ??
    browserTimeZone()
  );
}
