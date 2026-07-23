import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Rfi from "../layouts/Rfi";
import { getRequest, postRequest } from "@/lib/axiosInstance";

const mockedUserRole = vi.hoisted(() => ({
  isManager: true,
  isApprover: false,
  isVendor: false,
  isProjectManager: false,
  isAdmin: false,
  isViewOnly: false,
}));

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => mockedUserRole,
}));

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => [...key, "user-1"],
}));

// Mutable "current user" — Rfi.tsx's issuer/responder identity checks read
// useUser() directly from the store. Default to no user so the existing
// pagination test's behavior (no issuer/responder gates exercised) is
// unaffected unless a test explicitly opts in.
const mockedCurrentUser = vi.hoisted(() => ({ value: { _id: undefined as string | undefined } }));

vi.mock("@/store/authSlice", () => ({
  useUser: () => mockedCurrentUser.value,
  useSetReset: () => vi.fn(),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/layouts/DataTable", () => ({
  DataTable: ({ data, columns, options, header }: any) => (
    <div
      data-testid="rfi-table"
      data-manual-pagination={String(options?.manualPagination)}
      data-disable-pagination={String(options?.disablePagination)}
      data-total-counts={String(options?.totalCounts)}
    >
      {header?.()}
      <div data-testid="rfi-row-count">{data.length}</div>
      {data.map((row: any, index: number) => (
        <div key={row.id ?? index} data-testid="rfi-row">
          {(columns ?? []).map((col: any, colIndex: number) => {
            const value = col.accessorKey ? row[col.accessorKey] : undefined;
            const content =
              typeof col.cell === "function"
                ? col.cell({ row: { original: row, index }, getValue: () => value })
                : (value ?? null);
            return (
              <React.Fragment key={col.id ?? col.accessorKey ?? colIndex}>
                {content}
              </React.Fragment>
            );
          })}
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          options?.setPagination?.((prev: { pageIndex: number; pageSize: number }) => ({
            ...prev,
            pageIndex: prev.pageIndex + 1,
          }))
        }
      >
        Next RFI page
      </button>
    </div>
  ),
}));

vi.mock("@/components/layouts/ExportReportSheet", () => ({
  ExportReportSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/ContractManagementPage/components/RfiStatsCards", () => ({
  default: () => <div data-testid="rfi-stats" />,
}));

vi.mock("@/components/layouts/FormInputs", () => ({
  TextArea: () => null,
  TextDatePicker: () => null,
  TextFileUploader: () => null,
  TextInput: () => null,
  TextSelect: () => null,
}));

vi.mock("@adexdsamson/forge", () => ({
  Forge: ({ children }: { children: React.ReactNode }) => <form>{children}</form>,
  Forger: () => null,
  useForge: () => ({
    control: {},
    reset: vi.fn(),
  }),
}));

vi.mock("react-hook-form", () => ({
  useWatch: () => null,
}));

vi.mock("@/components/ui/file-upload", () => ({
  FileUploaderItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/pages/ContractManagementPage/components/DocumentItem", () => ({
  DocumentItem: () => <div />,
}));

vi.mock("@/pages/SolicitationManagementPage/components/MessageComposer", () => ({
  default: () => <div data-testid="message-composer" />,
}));

const mockedGetRequest = vi.mocked(getRequest);
const mockedPostRequest = vi.mocked(postRequest);

// Controls what the RFI list query resolves to, per test — the actions
// column (and thus RfiDetailsSheet's close/edit gating) is driven purely off
// these row fields (fallback = row.original.raw), no detail query needed.
const mockRfiRows = vi.hoisted(() => ({ list: [] as any[] }));

const renderRfi = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Rfi contractId="msa-rfi-123" isActive />
    </QueryClientProvider>,
  );

  return queryClient;
};

describe("MSA RFI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRfiRows.list = [];
    mockedCurrentUser.value = { _id: undefined };
    Object.assign(mockedUserRole, {
      isManager: true,
      isApprover: false,
      isVendor: false,
      isProjectManager: false,
      isAdmin: false,
      isViewOnly: false,
    });
    mockedGetRequest.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith("/stats")) {
        return { data: { data: { all: 25, issue: 15, receive: 10 } } };
      }

      if (url.endsWith("/personnel")) {
        return { data: { data: [] } };
      }

      return {
        data: {
          data: {
            contractRfis: mockRfiRows.list,
            total: mockRfiRows.list.length || 25,
          },
        },
      };
    });
    mockedPostRequest.mockResolvedValue({ data: { message: "RFI closed" } } as any);
  });

  test("uses server pagination for the MSA RFI list", async () => {
    renderRfi();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-rfi-123/rfi?page=1&limit=10",
        }),
      );
    });

    await waitFor(() => {
      const table = screen.getByTestId("rfi-table");
      expect(table).toHaveAttribute("data-manual-pagination", "true");
      expect(table).not.toHaveAttribute("data-disable-pagination", "true");
      expect(table).toHaveAttribute("data-total-counts", "25");
    });

    fireEvent.click(screen.getByRole("button", { name: "Next RFI page" }));

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-rfi-123/rfi?page=2&limit=10",
        }),
      );
    });
  });

  test("issuer, status open: close button posts to the singular MSA /rfi/{id}/close", async () => {
    const ISSUER_ID = "issuer-1";
    mockRfiRows.list = [
      {
        _id: "rfi-1",
        rfiId: "RFI-100",
        title: "Test RFI",
        type: "issue",
        status: "open",
        submittedBy: { _id: ISSUER_ID, name: "Issuer" },
      },
    ];
    mockedCurrentUser.value = { _id: ISSUER_ID };

    renderRfi();

    const trigger = await screen.findByTestId("close-rfi-trigger");
    const confirmButtons = screen
      .getAllByRole("button", { name: "Close RFI" })
      .filter((el) => el !== trigger);
    expect(confirmButtons.length).toBeGreaterThan(0);
    fireEvent.click(confirmButtons[0]);

    await waitFor(() => {
      expect(mockedPostRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-rfi-123/rfi/rfi-1/close",
        }),
      );
    });

    const calledUrl = mockedPostRequest.mock.calls[0][0].url as string;
    expect(calledUrl).not.toMatch(/\/rfis\//);
  });

  test("non-issuer: close button is absent", async () => {
    mockRfiRows.list = [
      {
        _id: "rfi-1",
        rfiId: "RFI-100",
        title: "Test RFI",
        type: "issue",
        status: "open",
        submittedBy: { _id: "issuer-1", name: "Issuer" },
      },
    ];
    mockedCurrentUser.value = { _id: "someone-else" };

    renderRfi();

    await screen.findByTestId("rfi-row-count");
    expect(screen.queryByTestId("close-rfi-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-rfi-trigger")).not.toBeInTheDocument();
  });

  test("issuer, status closed: both close and edit triggers are absent (MSA has no separate closed-gate for edit)", async () => {
    const ISSUER_ID = "issuer-1";
    mockRfiRows.list = [
      {
        _id: "rfi-1",
        rfiId: "RFI-100",
        title: "Test RFI",
        type: "issue",
        status: "closed",
        submittedBy: { _id: ISSUER_ID, name: "Issuer" },
      },
    ];
    mockedCurrentUser.value = { _id: ISSUER_ID };

    renderRfi();

    await screen.findByTestId("rfi-row-count");
    expect(screen.queryByTestId("close-rfi-trigger")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-rfi-trigger")).not.toBeInTheDocument();
  });

  test("issuer, status open: edit trigger renders the Edit RFI dialog, no plural base anywhere", async () => {
    const ISSUER_ID = "issuer-1";
    mockRfiRows.list = [
      {
        _id: "rfi-1",
        rfiId: "RFI-100",
        title: "Test RFI",
        type: "issue",
        status: "open",
        submittedBy: { _id: ISSUER_ID, name: "Issuer" },
      },
    ];
    mockedCurrentUser.value = { _id: ISSUER_ID };

    renderRfi();

    const editTrigger = await screen.findByTestId("edit-rfi-trigger");
    fireEvent.click(editTrigger);

    expect(await screen.findByText("Edit RFI")).toBeInTheDocument();
  });
});
