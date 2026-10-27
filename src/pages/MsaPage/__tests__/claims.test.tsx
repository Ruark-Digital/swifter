import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Claims from "../layouts/Claims";
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
}));

vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/layouts/DataTable", () => ({
  DataTable: ({ data, options, header }: any) => (
    <div>
      {header?.()}
      <div data-testid="claim-row-count">{data.length}</div>
      <button
        type="button"
        onClick={() =>
          options?.setPagination?.((prev: { pageIndex: number; pageSize: number }) => ({
            ...prev,
            pageIndex: prev.pageIndex + 1,
          }))
        }
      >
        Next claims page
      </button>
    </div>
  ),
}));

vi.mock("@/components/layouts/ExportReportSheet", () => ({
  ExportReportSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/ContractManagementPage/components/ClaimsStatsCards", () => ({
  default: () => <div data-testid="claims-stats" />,
}));

vi.mock("@/pages/ContractManagementPage/components/RequestClaimDialog", () => ({
  default: ({
    createPath,
    invalidateQueryKey,
    trigger,
  }: {
    createPath?: string;
    invalidateQueryKey?: readonly unknown[];
    trigger: React.ReactNode;
  }) => (
    <div
      data-testid="request-claim-dialog"
      data-create-path={createPath}
      data-invalidate-key={JSON.stringify(invalidateQueryKey)}
    >
      {trigger}
    </div>
  ),
}));

vi.mock("@/pages/ContractManagementPage/components/ClaimsTable", () => ({
  default: ({
    rows,
    totalCount,
    setPagination,
  }: {
    rows?: unknown[];
    totalCount?: number;
    setPagination?: (
      updater: (prev: { pageIndex: number; pageSize: number }) =>
        | { pageIndex: number; pageSize: number },
    ) => void;
  }) => (
    <div data-testid="claims-table">
      <div data-testid="claims-row-count">{rows?.length ?? 0}</div>
      <div data-testid="claims-total-count">{totalCount ?? 0}</div>
      <button
        type="button"
        onClick={() =>
          setPagination?.((prev) => ({
            ...prev,
            pageIndex: prev.pageIndex + 1,
          }))
        }
      >
        Next claims page
      </button>
    </div>
  ),
}));

const mockedGetRequest = vi.mocked(getRequest);

const resetRole = () => {
  Object.assign(mockedUserRole, {
    isManager: true,
    isApprover: false,
    isVendor: false,
    isProjectManager: false,
    isAdmin: false,
    isViewOnly: false,
  });
};

const renderClaims = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Claims contractId="msa-claims-123" isActive />
    </QueryClientProvider>,
  );

  return queryClient;
};

describe("MSA Claims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRole();
    mockedGetRequest.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith("/stats")) {
        return { data: { data: { all: 12, pending: 3, approved: 8, rejected: 1 } } };
      }

      return {
        data: {
          data: {
            claims: [],
            total: 12,
          },
        },
      };
    });
  });

  test("uses bare MSA claim query keys and server pagination", async () => {
    const queryClient = renderClaims();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-claims-123/claims?page=1&limit=10",
        }),
      );
    });

    const queryKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);

    expect(queryKeys).toContainEqual([
      "msa-claims",
      "stats",
      "msa-claims-123",
      "/contract/manager/msa-contracts/msa-claims-123/claims/stats",
    ]);
    expect(queryKeys).toContainEqual([
      "msa-claims",
      "msa-claims-123",
      0,
      10,
      "/contract/manager/msa-contracts/msa-claims-123/claims",
    ]);
    expect(queryKeys).not.toContainEqual(expect.arrayContaining(["user-1"]));

    fireEvent.click(screen.getByRole("button", { name: "Next claims page" }));

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-claims-123/claims?page=2&limit=10",
        }),
      );
    });
  });

  test("renders rows when BE returns claims under the `changes` key", async () => {
    mockedGetRequest.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith("/stats")) {
        return { data: { data: { all: 1, pending: 1, approved: 0, rejected: 0 } } };
      }

      // BE returns claims under `changes` (claims endpoint reuses the
      // change-order list shape), not `claims`/`contractClaims`.
      return {
        data: {
          data: {
            changes: [
              {
                _id: "claim-1",
                claimId: "CLR-001",
                status: "under review",
                title: "Eos quae aliquip lab",
              },
            ],
            total: 1,
          },
        },
      };
    });

    renderClaims();

    await waitFor(() => {
      expect(screen.getByTestId("claims-row-count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("claims-total-count")).toHaveTextContent("1");
  });

  test("treats admin like the contract reference for MSA claims", async () => {
    Object.assign(mockedUserRole, {
      isManager: false,
      isAdmin: true,
    });

    renderClaims();

    // Admin falls through to the user prefix in basePath; every role
    // uses plural `claims` (singular `claim` 404s on the BE).
    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/user/msa-contracts/msa-claims-123/claims?page=1&limit=10",
        }),
      );
    });

    expect(screen.queryByRole("button", { name: "Create Claim" })).not.toBeInTheDocument();
  });

  test("vendor claim creation uses plural path and bare shared invalidation prefix", async () => {
    Object.assign(mockedUserRole, {
      isManager: false,
      isVendor: true,
    });

    renderClaims();

    const dialog = await screen.findByTestId("request-claim-dialog");

    // BE expects plural `claims` for every role (singular `claim` 404s).
    expect(dialog).toHaveAttribute(
      "data-create-path",
      "/contract/vendor/msa-contracts/msa-claims-123/claims",
    );
    expect(dialog).toHaveAttribute("data-invalidate-key", JSON.stringify(["msa-claims"]));
  });
});
