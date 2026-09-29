import { describe, it, expect } from "vitest";
import {
  applySolicitationCompanyFilter,
  type SolicitationCompanyFilterRow,
} from "../lib/solicitationCompanyFilter";

// Minimal rows covering the fields the filter reads (name, contact, solId,
// issuing company, categories). The vendor solicitation list appends the
// issuing `company` per row; the company filter narrows the loaded page to a
// single issuing company.
const rows: SolicitationCompanyFilterRow[] = [
  {
    solId: "S-1",
    name: "Roofing Works",
    contact: "Alice",
    company: { _id: "c1", name: "Acme Corp" },
    categories: [{ name: "Construction" }],
  },
  {
    solId: "S-2",
    name: "HVAC Retrofit",
    contact: "Bob",
    company: { _id: "c2", name: "Globex Ltd" },
    categories: [{ name: "Mechanical" }],
  },
  {
    solId: "S-3",
    name: "Site Survey",
    contact: "Carol",
    company: { _id: "c1", name: "Acme Corp" },
    categories: [{ name: "Survey" }],
  },
  {
    // A public solicitation whose issuing company wasn't hydrated.
    solId: "S-4",
    name: "Open Bid",
    contact: "Dave",
    company: null,
    categories: [],
  },
];

const ids = (result: SolicitationCompanyFilterRow[]) =>
  result.map((r) => r.solId);

describe("applySolicitationCompanyFilter — vendor solicitation company filtering", () => {
  it("returns all rows when no filters are applied", () => {
    expect(
      applySolicitationCompanyFilter(rows, { enableCompanyFilter: true }),
    ).toHaveLength(4);
  });

  it("filters by issuing company only when the company filter is enabled", () => {
    // Enabled (vendor) → narrows to the selected company's solicitations.
    expect(
      ids(
        applySolicitationCompanyFilter(rows, {
          companyFilter: "c1",
          enableCompanyFilter: true,
        }),
      ),
    ).toEqual(["S-1", "S-3"]);

    // Not enabled (internal roles) → the company filter is ignored.
    expect(
      applySolicitationCompanyFilter(rows, {
        companyFilter: "c1",
        enableCompanyFilter: false,
      }),
    ).toHaveLength(4);
  });

  it("treats '' and 'all' as no company restriction", () => {
    expect(
      applySolicitationCompanyFilter(rows, {
        companyFilter: "",
        enableCompanyFilter: true,
      }),
    ).toHaveLength(4);
    expect(
      applySolicitationCompanyFilter(rows, {
        companyFilter: "all",
        enableCompanyFilter: true,
      }),
    ).toHaveLength(4);
  });

  it("excludes rows with no issuing company when a specific company is selected", () => {
    expect(
      ids(
        applySolicitationCompanyFilter(rows, {
          companyFilter: "c2",
          enableCompanyFilter: true,
        }),
      ),
    ).toEqual(["S-2"]);
  });

  it("combines the company filter with search", () => {
    // Acme + "roofing" → only the Roofing Works solicitation.
    expect(
      ids(
        applySolicitationCompanyFilter(rows, {
          search: "roofing",
          companyFilter: "c1",
          enableCompanyFilter: true,
        }),
      ),
    ).toEqual(["S-1"]);

    // Acme + "carol" (contact) → only the Site Survey solicitation.
    expect(
      ids(
        applySolicitationCompanyFilter(rows, {
          search: "carol",
          companyFilter: "c1",
          enableCompanyFilter: true,
        }),
      ),
    ).toEqual(["S-3"]);
  });

  it("searches across name, contact, solId, company name, and categories", () => {
    expect(ids(applySolicitationCompanyFilter(rows, { search: "hvac" }))).toEqual([
      "S-2",
    ]);
    expect(
      ids(applySolicitationCompanyFilter(rows, { search: "globex" })),
    ).toEqual(["S-2"]);
    expect(
      ids(applySolicitationCompanyFilter(rows, { search: "s-4" })),
    ).toEqual(["S-4"]);
    expect(
      ids(applySolicitationCompanyFilter(rows, { search: "mechanical" })),
    ).toEqual(["S-2"]);
  });
});
