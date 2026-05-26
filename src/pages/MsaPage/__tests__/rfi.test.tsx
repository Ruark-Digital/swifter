import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Rfi from "../layouts/Rfi";
import { getRequest } from "@/lib/axiosInstance";

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
  DataTable: ({ data, options, header }: any) => (
    <div
      data-testid="rfi-table"
      data-manual-pagination={String(options?.manualPagination)}
      data-disable-pagination={String(options?.disablePagination)}
      data-total-counts={String(options?.totalCounts)}
    >
      {header?.()}
      <div data-testid="rfi-row-count">{data.length}</div>
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

vi.mock("@/lib/forge", () => ({
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
            contractRfis: [],
            total: 25,
          },
        },
      };
    });
  });

  test("uses server pagination for the MSA RFI list", async () => {
    renderRfi();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contract/msa-rfi-123/rfi?page=1&limit=10",
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
          url: "/contract/manager/msa-contract/msa-rfi-123/rfi?page=2&limit=10",
        }),
      );
    });
  });
});
