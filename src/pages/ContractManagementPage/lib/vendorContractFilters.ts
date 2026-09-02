// Client-side row filtering for the vendor/PM contracts table. Kept pure and
// separate from the component so the filter routing stays unit-testable and the
// component file only exports components (react-refresh friendly).
import type { VendorContractRow } from "../components/VendorContractsTable";

export type VendorContractFilterInput = {
  search?: string;
  statusFilter?: string;
  companyFilter?: string;
  enableCompanyFilter?: boolean;
};

/**
 * Filtering runs over the current server page (search + status, plus company
 * for the PM), so the same page-scoped limitation applies as the existing
 * search/status filters.
 */
export const applyVendorContractFilters = (
  rows: VendorContractRow[],
  { search, statusFilter, companyFilter, enableCompanyFilter }: VendorContractFilterInput,
): VendorContractRow[] => {
  let result = rows;

  if (search) {
    const query = search.toLowerCase();
    result = result.filter(
      (row) =>
        row.title.toLowerCase().includes(query) ||
        row.code.toLowerCase().includes(query),
    );
  }

  if (statusFilter && statusFilter !== "all") {
    result = result.filter((row) => {
      if (statusFilter === "closed") {
        return ["Closed", "Expired", "Cancelled"].includes(row.status);
      }
      return row.status.toLowerCase() === statusFilter.toLowerCase();
    });
  }

  if (enableCompanyFilter && companyFilter && companyFilter !== "all") {
    result = result.filter((row) => row.company === companyFilter);
  }

  return result;
};
