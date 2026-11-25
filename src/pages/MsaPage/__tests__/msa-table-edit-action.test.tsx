import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import MsaTable, { type MsaRow } from "../components/MsaTable";

vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => ({ isManager: true }) }));
vi.mock("@/store/authSlice", async (importActual) => ({
  ...(await importActual<typeof import("@/store/authSlice")>()),
  useUser: () => ({ _id: "u1" }),
}));
// Stand-in for the edit dialog: shows only while the row's `open` prop is true.
vi.mock("@/pages/MsaPage/layouts/CreateMSADialog", () => ({
  default: ({ open, editingMsaId }: { open?: boolean; editingMsaId?: string }) =>
    open ? <div data-testid="edit-dialog">Editing {editingMsaId}</div> : null,
}));
vi.mock("@/pages/ContractManagementPage/components/ContractLifecycleDialog", () => ({
  default: () => null,
}));
vi.mock("@/components/layouts/SolicitationFilters", () => ({ DropdownFilters: () => null }));

const row: MsaRow = {
  id: "msa-1",
  title: "My MSA",
  code: "MSA-1",
  vendor: "Acme",
  owner: "Me",
  status: "Draft",
  isOwner: true,
};

describe("MSA list row actions (QA-047)", () => {
  it("Edit MSA opens the edit dialog for that row", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <MsaTable rows={[row]} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.queryByTestId("edit-dialog")).toBeNull();
    // Radix opens the menu from the keyboard; jsdom has no pointer capture.
    fireEvent.keyDown(await screen.findByTestId("msa-actions-dropdown"), {
      key: "Enter",
    });
    fireEvent.click(await screen.findByTestId("edit-msa"));
    await waitFor(() =>
      expect(screen.getByTestId("edit-dialog")).toHaveTextContent("Editing msa-1"),
    );
  });
});
