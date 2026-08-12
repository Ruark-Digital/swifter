import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { VendorDetailPage } from "../VendorDetailPage";

const getRequestMock = vi.fn();
const postRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/axiosInstance")>(
    "@/lib/axiosInstance",
  );
  return {
    ...actual,
    getRequest: (...args: unknown[]) => getRequestMock(...args),
    postRequest: (...args: unknown[]) => postRequestMock(...args),
  };
});

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useParams: () => ({ id: "vendor-1" }),
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/useToaster", () => {
  return {
    useToastHandler: () => ({
      error: vi.fn(),
      success: vi.fn(),
    }),
  };
});

vi.mock("@/components/ui/DocumentViewer", () => {
  return {
    DocumentViewer: () => <div data-testid="mock-document-viewer" />,
  };
});

describe("VendorDetailPage - Project Managers tab", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    postRequestMock.mockReset();
    navigateMock.mockReset();
  });

  it("disables resend invite when project manager is active", async () => {
    getRequestMock.mockResolvedValue({
      data: {
        status: true,
        message: "ok",
        data: {
          vendor: {
            _id: "vendor-1",
            name: "Test Vendor",
            vendorId: "V-001",
            location: "Test Location",
            businessType: "private_limited",
            status: "Active",
            isSuspended: false,
            website: "example.com",
            createdAt: "2026-01-01T00:00:00.000Z",
            user: {
              _id: "user-1",
              name: "Test User",
              email: "vendor@example.com",
              phone: "123",
            },
            submissions: [],
            documents: [],
          },
          submissions: [],
          projectmnagers: [
            {
              _id: "pm-1",
              email: "pm@example.com",
              status: "active",
              name: "pm@example.com",
              createdAt: "2026-04-12T18:24:24.189Z",
              invite: { _id: "invite-1", email: "pm@example.com" },
            },
          ],
        },
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <VendorDetailPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByText("Overview");

    // PM tab content is only mounted when active — activate the tab first.
    // Radix Tabs activates on pointerDown in jsdom (mouseDown alone is not
    // enough on every Radix version, so fire both).
    const pmTab = await screen.findByTestId(
      "project-managers-tab",
      undefined,
      { timeout: 7000 },
    );
    fireEvent.pointerDown(pmTab);
    fireEvent.mouseDown(pmTab);
    fireEvent.click(pmTab);

    await screen.findByTestId("project-managers-table", undefined, {
      timeout: 7000,
    });

    let menuButton: Element | null = null;
    await waitFor(
      () => {
        menuButton = document.querySelector('button[aria-haspopup="menu"]');
        expect(menuButton).toBeTruthy();
      },
      { timeout: 7000 },
    );
    fireEvent.pointerDown(menuButton as Element);
    fireEvent.click(menuButton as Element);

    const resend = await screen.findByRole("menuitem", {
      name: "Resend Invite",
    });
    expect(resend).toHaveAttribute("data-disabled");

    // #84 — a per-PM Manage Access menuitem lives in the row dropdown, above
    // Resend Invite (distinct from the vendor-account Manage Access button in
    // the page header).
    const manageAccess = await screen.findByRole("menuitem", {
      name: "Manage Access",
    });
    expect(manageAccess).toBeInTheDocument();
    expect(
      manageAccess.compareDocumentPosition(resend) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  }, 10000);
});
