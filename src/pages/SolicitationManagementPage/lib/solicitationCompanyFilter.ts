// Client-side row filtering for the vendor solicitation list. Kept pure and
// separate from the page component so the company-filter routing stays
// unit-testable and the component file only exports components (react-refresh
// friendly) — mirrors ContractManagementPage/lib/vendorContractFilters.ts.

// Structural subset of the page's Solicitation type covering only the fields
// the search + company filter read. A concrete `Solicitation` is assignable to
// this, so the caller keeps its own row type via the generic below.
export type SolicitationCompanyFilterRow = {
  name?: string;
  contact?: string;
  solId?: string;
  company?: { _id: string; name?: string | null } | null;
  categories?: { name?: string }[];
};

export type SolicitationCompanyFilterInput = {
  search?: string;
  companyFilter?: string;
  // The company filter is a vendor-only surface; internal roles never expose it.
  enableCompanyFilter?: boolean;
};

/**
 * Filtering runs over the current server page (search + company), so the same
 * page-scoped limitation applies as the existing search filter: only companies
 * present in the loaded rows are selectable.
 *
 * `companyFilter` of "" or "all" means "all companies" (no restriction).
 */
export const applySolicitationCompanyFilter = <
  T extends SolicitationCompanyFilterRow,
>(
  rows: T[],
  { search, companyFilter, enableCompanyFilter }: SolicitationCompanyFilterInput,
): T[] => {
  let result = rows;

  if (enableCompanyFilter && companyFilter && companyFilter !== "all") {
    result = result.filter((item) => item.company?._id === companyFilter);
  }

  if (search) {
    const query = search.toLowerCase();
    result = result.filter(
      (item) =>
        (item.name ?? "").toLowerCase().includes(query) ||
        (item.contact ?? "").toLowerCase().includes(query) ||
        (item.solId ?? "").toLowerCase().includes(query) ||
        (item.company?.name ?? "").toLowerCase().includes(query) ||
        (item.categories ?? []).some((cat) =>
          (cat.name ?? "").toLowerCase().includes(query),
        ),
    );
  }

  return result;
};
