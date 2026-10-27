import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ManageVendorAccessDialog from "../components/ManageVendorAccessDialog";

const getRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/axiosInstance")>(
    "@/lib/axiosInstance",
  );
  return {
    ...actual,
    getRequest: (...args: unknown[]) => getRequestMock(...args),
    putRequest: vi.fn(),
  };
});

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ error: vi.fn(), success: vi.fn() }),
}));

// Role catalog returned by GET /onboarding/roles (useRoleCatalog reads data.data.data).
const ROLE_CATALOG = [
  { _id: "role-vendor", name: "vendor" },
  { _id: "role-pm", name: "project_manager" },
  { _id: "role-cm", name: "contract_manager" },
];

const renderDialog = (currentRoles: unknown) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <ManageVendorAccessDialog
        open
        userId="user-1"
        vendorName="Alabian Academy"
        vendorId="vendor-1"
        currentRoles={currentRoles}
        onOpenChange={() => {}}
      />
    </QueryClientProvider>,
  );
};

describe("ManageVendorAccessDialog", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    getRequestMock.mockResolvedValue({ data: { data: ROLE_CATALOG } });
  });

  it("pre-selects the vendor's existing roles from the detail payload", async () => {
    // Populated {_id, name} role objects, exactly as the vendor-detail API returns.
    renderDialog([
      { _id: "role-pm", name: "project_manager" },
      { _id: "role-vendor", name: "vendor" },
    ]);

    await waitFor(() => {
      expect(screen.getByText("Vendor (Solicitation)")).toBeInTheDocument();
      expect(screen.getByText("Vendor-PM (CLM)")).toBeInTheDocument();
    });
  });

  it("does not fetch /users/{id} when current roles are supplied", async () => {
    renderDialog([{ _id: "role-vendor", name: "vendor" }]);

    await waitFor(() => {
      expect(screen.getByText("Vendor (Solicitation)")).toBeInTheDocument();
    });
    // Only the role catalog is fetched — never the redundant /users/{id}.
    const urls = getRequestMock.mock.calls.map((c) => (c[0] as { url: string }).url);
    expect(urls.some((u) => u.startsWith("/users/"))).toBe(false);
    expect(urls).toContain("/onboarding/roles");
  });
});
