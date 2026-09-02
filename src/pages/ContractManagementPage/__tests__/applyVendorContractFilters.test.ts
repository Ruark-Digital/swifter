import { describe, it, expect } from "vitest";
import { applyVendorContractFilters } from "../lib/vendorContractFilters";
import type { VendorContractRow } from "../components/VendorContractsTable";

// Minimal rows covering the fields the filters read (title, code, status,
// company). Company filter is the vendor-PM addition (the QA request).
const rows: VendorContractRow[] = [
  {
    id: "1",
    contractId: "C-001",
    title: "Roofing Works",
    code: "C-001",
    company: "Acme Corp",
    contractRelationship: "Stand-Alone Project",
    status: "Active",
  },
  {
    id: "2",
    contractId: "C-002",
    title: "HVAC Retrofit",
    code: "C-002",
    company: "Globex Ltd",
    contractRelationship: "Linked to Project",
    status: "Suspended",
  },
  {
    id: "3",
    contractId: "C-003",
    title: "Site Survey",
    code: "C-003",
    company: "Acme Corp",
    contractRelationship: "Linked to MSA",
    status: "Expired",
  },
];

describe("applyVendorContractFilters — vendor/PM contract list filtering", () => {
  it("returns all rows when no filters are applied", () => {
    expect(applyVendorContractFilters(rows, {})).toHaveLength(3);
  });

  it("filters by company only when the company filter is enabled", () => {
    // Enabled → narrows to the selected company.
    const acme = applyVendorContractFilters(rows, {
      companyFilter: "Acme Corp",
      enableCompanyFilter: true,
    });
    expect(acme.map((r) => r.id)).toEqual(["1", "3"]);

    // Not enabled → the company filter is ignored (non-PM parity).
    expect(
      applyVendorContractFilters(rows, {
        companyFilter: "Acme Corp",
        enableCompanyFilter: false,
      }),
    ).toHaveLength(3);
  });

  it("treats 'all' as no company restriction", () => {
    expect(
      applyVendorContractFilters(rows, {
        companyFilter: "all",
        enableCompanyFilter: true,
      }),
    ).toHaveLength(3);
  });

  it("combines company with search and status filters", () => {
    // Acme + closed-bucket (Expired) → only the Site Survey row.
    const result = applyVendorContractFilters(rows, {
      statusFilter: "closed",
      companyFilter: "Acme Corp",
      enableCompanyFilter: true,
    });
    expect(result.map((r) => r.id)).toEqual(["3"]);

    // Search matches title/code; combined with company narrows further.
    expect(
      applyVendorContractFilters(rows, {
        search: "roofing",
        companyFilter: "Acme Corp",
        enableCompanyFilter: true,
      }).map((r) => r.id),
    ).toEqual(["1"]);
  });

  it("still applies search and status when company filtering is off", () => {
    expect(
      applyVendorContractFilters(rows, { search: "hvac" }).map((r) => r.id),
    ).toEqual(["2"]);
    expect(
      applyVendorContractFilters(rows, { statusFilter: "active" }).map(
        (r) => r.id,
      ),
    ).toEqual(["1"]);
  });
});
