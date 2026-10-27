import React from "react";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Deliverables from "../layouts/Deliverables";
import { getRequest } from "@/lib/axiosInstance";

const mockedUserRole = vi.hoisted(() => ({
  isApprover: false,
  isVendor: false,
  isProjectManager: false,
  isManager: true,
  isCompanyAdmin: false,
  isSuperAdmin: false,
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

vi.mock("@/components/layouts/ExportReportSheet", () => ({
  ExportReportSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/ContractManagementPage/components/DeliverablesStatsCards", () => ({
  default: () => <div data-testid="deliverables-stats" />,
}));

vi.mock("@/pages/ContractManagementPage/components/DeliverablesTable", () => ({
  default: ({
    basePath,
    isContractManager,
    listInvalidateQueryKey,
    personnelPath,
    statsInvalidateQueryKey,
  }: {
    basePath?: string;
    isContractManager?: boolean;
    listInvalidateQueryKey?: readonly unknown[];
    personnelPath?: string;
    statsInvalidateQueryKey?: readonly unknown[];
  }) => (
    <div
      data-testid="deliverables-table"
      data-base-path={basePath}
      data-is-contract-manager={String(isContractManager)}
      data-list-key={JSON.stringify(listInvalidateQueryKey)}
      data-personnel-path={personnelPath}
      data-stats-key={JSON.stringify(statsInvalidateQueryKey)}
    />
  ),
}));

const mockedGetRequest = vi.mocked(getRequest);

const renderDeliverables = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <Deliverables contractId="msa-deliv-123" isActive />
    </QueryClientProvider>,
  );

  return queryClient;
};

describe("MSA Deliverables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockedUserRole, {
      isApprover: false,
      isVendor: false,
      isProjectManager: false,
      isManager: true,
      isCompanyAdmin: false,
      isSuperAdmin: false,
      isViewOnly: false,
    });
    mockedGetRequest.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith("/stats")) {
        return { data: { data: { all: 7, submitted: 3, pending: 2, late: 2 } } };
      }

      return {
        data: {
          data: [
            {
              deliverableId: "deliverable-1",
              title: "Monthly service report",
              status: "pending",
              submissionStatus: "pending",
            },
          ],
        },
      };
    });
  });

  test("uses bare MSA deliverable query keys and passes matching table invalidation keys", async () => {
    const queryClient = renderDeliverables();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-deliv-123/deliverables",
        }),
      );
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/msa-deliv-123/deliverables/stats",
        }),
      );
    });

    const listKey = [
      "msa-deliverables",
      "msa-deliv-123",
      "/contract/manager/msa-contracts/msa-deliv-123/deliverables",
    ];
    const statsKey = [
      "msa-deliverables-stats",
      "msa-deliv-123",
      "/contract/manager/msa-contracts/msa-deliv-123/deliverables",
    ];

    const queryKeys = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.queryKey);

    expect(queryKeys).toContainEqual(listKey);
    expect(queryKeys).toContainEqual(statsKey);
    expect(queryKeys).not.toContainEqual(expect.arrayContaining(["user-1"]));

    const table = await waitFor(() => {
      const element = document.querySelector('[data-testid="deliverables-table"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });

    expect(table).toHaveAttribute(
      "data-base-path",
      "/contract/manager/msa-contracts/msa-deliv-123/deliverables",
    );
    expect(table).toHaveAttribute("data-is-contract-manager", "true");
    expect(table).toHaveAttribute("data-list-key", JSON.stringify(listKey));
    expect(table).toHaveAttribute(
      "data-personnel-path",
      "/contract/vendor/msa-contracts/msa-deliv-123/personnel",
    );
    expect(table).toHaveAttribute("data-stats-key", JSON.stringify(statsKey));
  });
});
