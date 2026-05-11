import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";

vi.mock("@/components/ui/DocumentViewer", () => {
  return { DocumentViewer: () => null };
});

describe("InvoiceTable", () => {
  it(
    "uses an invoice-specific search placeholder",
    async () => {
      const { default: InvoiceTable } = await import("../components/InvoiceTable");

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
});
