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
    setPagination,
  }: {
    setPagination?: (
      updater: (prev: { pageIndex: number; pageSize: number }) =>
        | { pageIndex: number; pageSize: number },
    ) => void;
  }) => (
    <div data-testid="claims-table">
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

  test("treats admin like the contract reference for MSA claims", async () => {
    Object.assign(mockedUserRole, {
      isManager: false,
      isAdmin: true,
    });

    renderClaims();

    // Admin falls through to the user prefix in basePath, and per BE
    // spec only manager uses plural `claims` — every other role uses
    // singular `claim`.
    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/user/msa-contracts/msa-claims-123/claim?page=1&limit=10",
        }),
      );
    });

    expect(screen.queryByRole("button", { name: "Create Claim" })).not.toBeInTheDocument();
  });

  test("vendor claim creation uses singular path per BE spec and bare shared invalidation prefix", async () => {
    Object.assign(mockedUserRole, {
      isManager: false,
      isVendor: true,
    });

    renderClaims();

    const dialog = await screen.findByTestId("request-claim-dialog");

    // BE plurality is role-asymmetric: vendor / approver / view-only use
    // singular `claim`; only manager uses plural `claims`. See
    // memory msa-url-routing-bug-classes Class 4.
    expect(dialog).toHaveAttribute(
      "data-create-path",
      "/contract/vendor/msa-contracts/msa-claims-123/claim",
    );
    expect(dialog).toHaveAttribute("data-invalidate-key", JSON.stringify(["msa-claims"]));
  });
});
