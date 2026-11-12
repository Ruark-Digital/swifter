import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, test, vi } from "vitest";
import ChangeDetailsSheet from "../components/ChangeDetailsSheet";

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    isManager: false,
    isApprover: false,
    isVendor: false,
    isProjectManager: true,
    isAdmin: false,
    isViewOnly: false,
  }),
}));

vi.mock("@/store/authSlice", () => ({
  useUser: () => ({ _id: "pm-1" }),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ error: vi.fn(), success: vi.fn() }),
}));

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(async () => ({
    data: {
      data: {
        _id: "chg-1",
        title: "Extra scope",
        description: "More work",
        type: "request",
        status: "pending",
        requestedBy: { _id: "pm-1", name: "PM" },
      },
    },
  })),
  postRequest: vi.fn(),
}));

// Capture what the sheet tells the edit dialog.
vi.mock("../components/CreateChangeDialog", () => ({
  default: ({ documentType }: { documentType?: string }) => (
    <div data-testid="edit-dialog" data-document-type={documentType ?? "(default)"} />
  ),
}));

const renderSheet = (basePath: string) =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ChangeDetailsSheet contractId="doc-1" changeId="chg-1" basePath={basePath} open />
    </QueryClientProvider>,
  );

describe("ChangeDetailsSheet PM edit targets the right document type", () => {
  test("MSA change edits save to the MSA endpoint", async () => {
    renderSheet("/contract/vendor/msa-contracts/doc-1/changes");
    expect(await screen.findByTestId("edit-dialog")).toHaveAttribute(
      "data-document-type",
      "MsaContract",
    );
  });

  test("contract change edits keep the contract endpoint", async () => {
    renderSheet("/contract/vendor/contracts/doc-1/changes");
    expect(await screen.findByTestId("edit-dialog")).toHaveAttribute(
      "data-document-type",
      "Contract",
    );
  });
});
