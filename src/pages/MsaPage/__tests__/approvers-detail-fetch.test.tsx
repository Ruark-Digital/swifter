import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tabs } from "@/components/ui/tabs";

// Mock the API + hooks the approver tab depends on.
const getRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: (...args: any[]) => getRequestMock(...args),
  postRequest: vi.fn(),
}));

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (value: unknown) => value,
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));

// Default: manager role -> basePath /contract/manager/msa-contracts/:id
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    isManager: true,
    isApprover: false,
    isVendor: false,
    isProjectManager: false,
    isViewOnly: false,
    role: "contract_manager",
  }),
}));

import Approvers from "../layouts/Approvers";

const CONTRACT_ID = "msa-1";
const APPROVER_ID = "approver-1";

// Flat approver list shape the tab maps into a row (approverId -> row.id).
const listResponse = {
  data: {
    data: [
      {
        approverId: APPROVER_ID,
        name: "List Name",
        email: "list@example.com",
        role: "contract_manager",
        approvalLevels: [1],
        assignedApprovals: "1/3",
        status: "Pending",
      },
    ],
  },
};

// Richer detail payload returned by the dedicated detail endpoint.
const detailResponse = {
  data: {
    data: {
      approver: { _id: APPROVER_ID, name: "Detail Name", email: "detail@example.com" },
      submissionDate: "2026-07-30T12:00:00.000Z",
      assignedApproval: { completed: 2, total: 3 },
      status: "Partially Approved",
      items: {
        changes: [
          {
            refId: "chg-1",
            refType: "change",
            refCode: "CHG-001",
            title: "Scope Adjustment",
            status: "approved",
          },
        ],
      },
    },
  },
};

const renderTab = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Tabs defaultValue="approvers">
        <Approvers contractId={CONTRACT_ID} isActive />
      </Tabs>
    </QueryClientProvider>,
  );

describe("MSA Approvers tab — detail sheet fetch", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    getRequestMock.mockImplementation(async ({ url }: { url: string }) => {
      if (url.includes(`/approvers/${APPROVER_ID}`)) return detailResponse;
      if (url.includes("/approvers")) return listResponse;
      return { data: { data: [] } };
    });
  });

  it("fetches the role-aware MSA approvers list", async () => {
    renderTab();
    await waitFor(() =>
      expect(getRequestMock).toHaveBeenCalledWith({
        url: `/contract/manager/msa-contracts/${CONTRACT_ID}/approvers`,
      }),
    );
  });

  it("fetches the dedicated approver detail when the sheet opens", async () => {
    renderTab();

    // List loads first.
    await waitFor(() =>
      expect(screen.getByText("List Name")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText("View"));

    await waitFor(() =>
      expect(getRequestMock).toHaveBeenCalledWith({
        url: `/contract/manager/msa-contracts/${CONTRACT_ID}/approvers/${APPROVER_ID}`,
      }),
    );

    // Detail overrides list values + renders per-type items.
    expect(await screen.findByText("Detail Name")).toBeInTheDocument();
    expect(
      await screen.findByText("detail@example.com"),
    ).toBeInTheDocument();
    // completed/total from assignedApproval.
    expect(await screen.findByText("2/3")).toBeInTheDocument();
    // Per-type approval item title + status badge.
    expect(await screen.findByText("Scope Adjustment")).toBeInTheDocument();
    expect(await screen.findByText("approved")).toBeInTheDocument();
  });
});
