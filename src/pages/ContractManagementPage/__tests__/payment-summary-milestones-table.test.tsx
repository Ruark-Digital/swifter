import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, test } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import PaymentSummaryMilestonesTable from "../components/PaymentSummaryMilestonesTable";

type Row = { savingsId: string; savingsTitle: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "savingsId", header: "Savings ID" },
  { accessorKey: "savingsTitle", header: "Savings Title" },
];

const rows: Row[] = [{ savingsId: "SR-001", savingsTitle: "vilis utpote cinis" }];

// Regression (mobile overflow): the search box used to be a fixed w-[300px],
// which pushed the table card past a phone viewport. It must be full-width on
// mobile and only pin to 300px at >=sm.
describe("PaymentSummaryMilestonesTable — responsive search header", () => {
  test("search input is full-width on mobile, not a fixed 300px", () => {
    render(
      <PaymentSummaryMilestonesTable<Row>
        title="Savings"
        rows={rows}
        columns={columns}
        getRowSearchValues={(row) => [row.savingsId, row.savingsTitle]}
      />
    );

    const input = screen.getByPlaceholderText("Search");
    const cls = input.className;

    expect(cls).toContain("w-full");
    expect(cls).toContain("sm:w-[300px]");
    // No bare (mobile) fixed 300px width that would overflow the viewport.
    expect(cls).not.toMatch(/(^|\s)w-\[300px\](\s|$)/);
  });
});
