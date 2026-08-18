import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ManageProjectManagerAccessDialog from "../components/ManageProjectManagerAccessDialog";

vi.mock("@/lib/axiosInstance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/axiosInstance")>(
    "@/lib/axiosInstance",
  );
  return { ...actual, putRequest: vi.fn() };
});

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ error: vi.fn(), success: vi.fn() }),
}));

const renderDialog = (currentRole: string | string[]) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ManageProjectManagerAccessDialog
        open
        pmId="pm-1"
        pmName="Samson ade"
        vendorId="vendor-1"
        currentRole={currentRole}
        onOpenChange={() => {}}
      />
    </QueryClientProvider>,
  );
};

describe("ManageProjectManagerAccessDialog", () => {
  it("pre-selects both roles when the PM has vendor + project_manager access", async () => {
    // A PM who also holds vendor access — both chips must show, not just one.
    renderDialog(["project_manager", "vendor"]);

    await waitFor(() => {
      expect(screen.getByText("Vendor-PM (CLM)")).toBeInTheDocument();
      expect(screen.getByText("Vendor (Solicitation)")).toBeInTheDocument();
    });
  });

  it("pre-selects a single role when the PM has only that role", async () => {
    renderDialog("vendor");

    await waitFor(() => {
      expect(screen.getByText("Vendor (Solicitation)")).toBeInTheDocument();
    });
    expect(screen.queryByText("Vendor-PM (CLM)")).not.toBeInTheDocument();
  });
});
