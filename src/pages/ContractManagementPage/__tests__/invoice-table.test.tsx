import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import InvoiceTable from "../components/InvoiceTable";

vi.mock("@/components/ui/DocumentViewer", () => {
  return { DocumentViewer: () => null };
});

vi.mock("@/components/layouts/DataTable", async () => {
  const React = await import("react");

  return {
    DataTable: ({ data, header }: any) =>
      React.createElement(
        "div",
        null,
        header?.({}),
        data.map((row: any) =>
          React.createElement(
            "div",
            { key: row.id },
            React.createElement("div", null, row.id),
            React.createElement("div", null, `Remaining: ${row.remaining}`),
          ),
        ),
      ),
  };
});

describe("InvoiceTable", () => {
  it(
    "uses an invoice-specific search placeholder",
    () => {
      render(
        <InvoiceTable
          contractId="c-1"
          pagination={{ pageIndex: 0, pageSize: 10 }}
          setPagination={vi.fn() as any}
          rows={[]}
        />,
      );

      expect(screen.getByPlaceholderText("Search invoices")).toBeInTheDocument();
    },
    20000,
  );

  it(
    "shows invoice remaining amount when the invoice payload includes it",
    () => {
      render(
        <InvoiceTable
          contractId="c-1"
          pagination={{ pageIndex: 0, pageSize: 10 }}
          setPagination={vi.fn() as any}
          rows={[
            {
              _id: "inv-2",
              invoiceId: "INV-002",
              type: "progress draw",
              amount: 395000,
              remaining: -533040,
              status: "pending",
            },
          ]}
          currency="USD"
        />,
      );

      expect(screen.getByText(/-\$533,040\.00/)).toBeInTheDocument();
    },
    20000,
  );
});
