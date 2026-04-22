import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VendorDetailPage } from "../VendorDetailPage";
import type { ReactNode } from "react";

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
  const actual = await vi.importActual<typeof import("react-router-dom")>(
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

vi.mock("@/components/layouts/DataTable", () => {
  return {
    DataTable: ({
      data,
      header,
      emptyPlaceholder,
    }: {
      data: unknown[];
      header?: () => ReactNode;
      emptyPlaceholder?: ReactNode;
    }) => (
      <div>
        {header?.()}
        <div data-testid="mock-data-table">{data.length}</div>
        {data.length === 0 ? emptyPlaceholder : null}
      </div>
    ),
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

  it("renders Project Managers tab and panel", async () => {
    getRequestMock.mockResolvedValueOnce({
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
              status: "pending",
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
        <VendorDetailPage />
      </QueryClientProvider>,
    );

    await screen.findByText("Overview");

    expect(screen.getByTestId("project-managers-tab")).toBeInTheDocument();
    expect(
      screen.getByTestId("vendor-project-managers-content"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("project-managers-table")).toBeInTheDocument();
  });
});
