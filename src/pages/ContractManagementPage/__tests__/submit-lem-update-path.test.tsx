import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SubmitLemDialog from "../components/SubmitLemDialog";
import { putRequest } from "@/lib/axiosInstance";
import { vendorApi } from "../api/vendorApi";

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/lib/axiosInstance", () => ({
  postRequest: vi.fn(),
  putRequest: vi.fn().mockResolvedValue({ data: { status: "success" } }),
}));

vi.mock("../api/vendorApi", () => ({
  vendorApi: {
    updateLem: vi.fn().mockResolvedValue({ data: { status: "success" } }),
    createLem: vi.fn(),
  },
}));

const renderResubmit = (updatePath?: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SubmitLemDialog
        trigger={<button type="button">Open LEM</button>}
        contractId="msa-1"
        mode="edit"
        isResubmit
        lemId="lem-1"
        updatePath={updatePath}
        initialLem={{ title: "Week 12", amount: 1000, description: "Crew hours" }}
      />
    </QueryClientProvider>,
  );

const submit = () => {
  fireEvent.click(screen.getByRole("button", { name: "Open LEM" }));
  fireEvent.click(screen.getByRole("button", { name: "Resubmit LEM" }));
};

describe("SubmitLemDialog resubmit endpoint", () => {
  beforeEach(() => vi.clearAllMocks());

  it("PUTs to updatePath when one is given (MSA resubmit)", async () => {
    renderResubmit("/contract/vendor/msa-contracts/msa-1/lems/lem-1");
    submit();

    await waitFor(() =>
      expect(putRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/vendor/msa-contracts/msa-1/lems/lem-1",
        }),
      ),
    );
    expect(vendorApi.updateLem).not.toHaveBeenCalled();
  });

  it("falls back to the contract endpoint without updatePath", async () => {
    renderResubmit();
    submit();

    await waitFor(() =>
      expect(vendorApi.updateLem).toHaveBeenCalledWith(
        "msa-1",
        "lem-1",
        expect.objectContaining({ title: "Week 12" }),
      ),
    );
    expect(putRequest).not.toHaveBeenCalled();
  });
});
