import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API + hooks the approvers table depends on.
const getContractApproverDetailsMock = vi.fn();

vi.mock("../api/contractManagerApi", () => ({
  contractManagerApi: {
    getContractApproverDetails: (...args: any[]) =>
      getContractApproverDetailsMock(...args),
    manageContractApprover: vi.fn(),
  },
}));

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (value: unknown) => value,
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import ApproversTable, { type ApproverRow } from "../components/ApproversTable";

const CONTRACT_ID = "6a91cb8994f1740cad49c321";
const APPROVER_ID = "6988ee1cf03a021ddab00a0c";

const row: ApproverRow = {
  id: APPROVER_ID,
  name: "Adediran Adeola Approver",
  email: "adediran.dbs+approver@gmail.com",
  role: "approver",
  approvalLevel: "3",
  assignedApprovals: "3/4",
  status: "Pending",
};

// Detail payload mirrors the real API shape: `items` carries a `holdbacks`
// category alongside invoices. Before the fix, holdbacks were absent from the
// render allowlist and never appeared.
const detailResponse = {
  data: {
    approver: { _id: APPROVER_ID, name: row.name, email: row.email },
    submissionDate: "2026-08-28T18:27:33.168Z",
    assignedApproval: { completed: 3, total: 4 },
    status: "pending",
    contract: { currency: "CAD" },
    items: {
      invoices: [
        {
          refId: "6a91d4f626d2b8012fb35d2a",
          refType: "invoice",
          refCode: "INV-001",
          title: "Hello holdback",
          status: "approved",
          level: 3,
          group: "Group 1",
          amount: 4000000,
        },
      ],
      holdbacks: [
        {
          refId: "6a92b3d6e11c44cb1e4cd9fd",
          refType: "holdback",
          refCode: "HB-001",
          status: "pending",
          level: 3,
          group: "Group 1",
          amount: 4000000,
        },
      ],
    },
  },
};

const renderTable = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ApproversTable rows={[row]} contractId={CONTRACT_ID} />
    </QueryClientProvider>,
  );

describe("Contract Approvers — Approval Status sheet", () => {
  beforeEach(() => {
    getContractApproverDetailsMock.mockReset();
    getContractApproverDetailsMock.mockResolvedValue(detailResponse);
  });

  it("renders the holdback approval item, not just invoices", async () => {
    renderTable();

    fireEvent.click(screen.getByText("View"));

    await waitFor(() =>
      expect(getContractApproverDetailsMock).toHaveBeenCalledWith(
        CONTRACT_ID,
        APPROVER_ID,
      ),
    );

    // Invoice item still renders.
    expect(await screen.findByText("INV-001")).toBeInTheDocument();
    // Regression: the holdback category + item must render (previously dropped).
    expect(await screen.findByText("Holdback")).toBeInTheDocument();
    expect(await screen.findByText("HB-001")).toBeInTheDocument();
  });
});
