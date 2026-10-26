import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SubmitLemDialog from "../components/SubmitLemDialog";

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

describe("SubmitLemDialog decimal-places warning", () => {
  it("shows the non-compliance warning when the submit dialog opens", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <SubmitLemDialog
          trigger={<button type="button">Open LEM</button>}
          contractId="contract-1"
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open LEM" }));

    expect(
      screen.getByText("Changing decimal places makes the LEM non-compliant"),
    ).toBeInTheDocument();
  });
});
