import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ChangeManagement from "../layouts/ChangeManagement";
import { getRequest } from "@/lib/axiosInstance";

const mockedUserRole = vi.hoisted(() => ({
  isManager: true,
  isApprover: false,
  isAdmin: false,
  isViewOnly: false,
  isVendor: false,
  isProjectManager: false,
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
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("@/components/layouts/DataTable", () => ({
  DataTable: ({ data, options, header }: any) => (
    <div>
      {header?.()}
      <div data-testid="row-count">{data.length}</div>
      <button
        type="button"
        onClick={() =>
          options?.setPagination?.((prev: { pageIndex: number; pageSize: number }) => ({
            ...prev,
            pageIndex: prev.pageIndex + 1,
          }))
        }
      >
        Next page
      </button>
    </div>
  ),
}));

vi.mock("@/components/layouts/ExportReportSheet", () => ({
  ExportReportSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/ContractManagementPage/components/ChangeStatsCards", () => ({
  default: () => <div data-testid="change-stats" />,
}));

vi.mock("@/pages/ContractManagementPage/components/CreateChangeDialog", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

vi.mock("@/pages/ContractManagementPage/components/ChangeDetailsSheet", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

const mockedGetRequest = vi.mocked(getRequest);

const renderChangeManagement = (owner?: boolean) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ChangeManagement contractId="msa-123" isActive owner={owner} />
    </QueryClientProvider>,
  );

  return queryClient;
};

describe("MSA ChangeManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockedUserRole, {
      isManager: true,
      isApprover: false,
      isAdmin: false,
      isViewOnly: false,
      isVendor: false,
      isProjectManager: false,
    });
    mockedGetRequest.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith("/stats")) {
        return { data: { data: { all: 25, pending: 2, approved: 20, rejected: 3 } } };
      }

      return {
        data: {
          data: {
            changes: [],
            total: 25,
          },
        },
      };
    });
  });

  test("uses bare MSA change query keys and server pagination", async () => {
    const queryClient = renderChangeManagement();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-123/changes?page=1&limit=10",
        }),
      );
    });

    const queryKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);

    expect(queryKeys).toContainEqual([
      "msaChanges",
      "stats",
      "msa-123",
      "/contract/manager/msa-contracts/msa-123",
    ]);
    expect(queryKeys).toContainEqual([
      "msaChanges",
      "msa-123",
      "all",
      0,
      10,
      "/contract/manager/msa-contracts/msa-123",
    ]);
    expect(queryKeys).not.toContainEqual(
      expect.arrayContaining(["user-1"]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-123/changes?page=2&limit=10",
        }),
      );
    });
  });

  test("reads admin changes from the manager endpoint, like contracts (QA #298)", async () => {
    Object.assign(mockedUserRole, {
      isManager: false,
      isAdmin: true,
    });

    renderChangeManagement();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-123/changes?page=1&limit=10",
        }),
      );
    });

    expect(screen.queryByRole("button", { name: "Create Change" })).not.toBeInTheDocument();
  });

  test("reads PM changes from the vendor endpoint even when also a manager", async () => {
    Object.assign(mockedUserRole, { isManager: true, isProjectManager: true });

    renderChangeManagement();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/vendor/msa-contracts/msa-123/changes?page=1&limit=10",
        }),
      );
    });
  });

  test.each([
    ["owning manager", { isManager: true }, true, true],
    ["non-owner manager", { isManager: true }, false, false],
    ["project manager", { isManager: false, isProjectManager: true }, false, true],
    ["vendor", { isManager: false, isVendor: true }, false, false],
  ])("Create Change matches the contract gate: %s", (_label, role, owner, visible) => {
    Object.assign(mockedUserRole, role);

    renderChangeManagement(owner);

    const button = screen.queryByRole("button", { name: "Create Change" });
    if (visible) expect(button).toBeInTheDocument();
    else expect(button).not.toBeInTheDocument();
  });
});
