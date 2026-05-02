import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/components/ui/tabs", () => {
  return {
    TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock("@/components/ui/DocumentViewer", () => {
  return { DocumentViewer: () => null };
});

vi.mock("@/pages/ContractManagementPage/components/CreateInvoiceDialog", () => {
  return { default: () => null };
});

describe("MSA Invoice", () => {
  it(
    "uses an invoice-specific search placeholder",
    async () => {
      const { default: Invoice } = await import("../layouts/Invoice");
      const queryClient = new QueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <Invoice contractId="c-1" isActive={false} />
        </QueryClientProvider>,
      );

      expect(screen.getByPlaceholderText("Search invoices")).toBeInTheDocument();
    },
    20000,
  );
});

