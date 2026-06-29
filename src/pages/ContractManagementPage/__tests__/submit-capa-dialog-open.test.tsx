import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, test, vi } from "vitest";
import SubmitCapaDialog from "../components/SubmitCapaDialog";

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

describe("SubmitCapaDialog", () => {
  test("opens from the NCR details footer without throwing", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SubmitCapaDialog
          contractId="contract-123"
          ncrId="ncr-123"
          ncrTitle="NCR title"
          basePath="/contract/manager/contracts/contract-123/ncrs"
          trigger={<button type="button">Submit CAPA</button>}
        />
      </QueryClientProvider>,
    );

    expect(() =>
      fireEvent.click(screen.getByRole("button", { name: "Submit CAPA" })),
    ).not.toThrow();

    expect(
      screen.getByText("Corrective & Preventive Action Plan"),
    ).toBeInTheDocument();
  });
});
