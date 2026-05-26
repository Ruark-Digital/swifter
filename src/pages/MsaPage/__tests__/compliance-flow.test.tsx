import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Compliance from "../layouts/Compliance";
import { Tabs } from "@/components/ui/tabs";

let mockedUserRole = {
  userRole: "view_only",
  isVendor: false,
  isProjectManager: false,
  isApprover: false,
  isManager: false,
  isAdmin: false,
  isViewOnly: false,
};

const getRequestMock = vi.fn();
const postRequestMock = vi.fn();

vi.mock("@/hooks/useUserRole", () => {
  return {
    useUserRole: () => mockedUserRole,
  };
});

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => key,
}));

vi.mock("@/lib/axiosInstance", () => {
  return {
    getRequest: (...args: any[]) => getRequestMock(...args),
    postRequest: (...args: any[]) => postRequestMock(...args),
  };
});

vi.mock("@/pages/ContractManagementPage/components/SubmitPolicyDialog", () => {
  return { default: ({ trigger }: { trigger: any }) => trigger };
});

vi.mock("@/pages/ContractManagementPage/components/ComplianceDetailsSheet", () => {
  return { default: ({ trigger }: { trigger: any }) => trigger };
});

vi.mock("@/components/layouts/DataTable", () => {
  return {
    DataTable: () => <div data-testid="datatable" />,
  };
});

describe("MSA Compliance flow", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    postRequestMock.mockReset();
  });

  it("allows project manager to see submit button when policy status is pending", async () => {
    mockedUserRole = {
      userRole: "project_manager",
      isVendor: false,
      isProjectManager: true,
      isApprover: false,
      isManager: false,
      isAdmin: false,
      isViewOnly: false,
    };

    getRequestMock.mockResolvedValue({
      data: {
        data: {
          details: {
            policyStatus: { status: "pending" },
            securityStatus: { status: "submitted" },
          },
          policy: [],
          security: [],
        },
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <Tabs value="compliance" onValueChange={() => {}}>
          <Compliance contractId="msa-1" isActive />
        </Tabs>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Compliance & Security Details"),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.queryByText("Loading compliance data..."),
      ).not.toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: "Submit Policies" }),
    ).toBeInTheDocument();
  });

  it("hides submit button when category status is submitted", async () => {
    mockedUserRole = {
      userRole: "vendor",
      isVendor: true,
      isProjectManager: false,
      isApprover: false,
      isManager: false,
      isAdmin: false,
      isViewOnly: false,
    };

    getRequestMock.mockResolvedValue({
      data: {
        data: {
          details: {
            policyStatus: { status: "submitted" },
            securityStatus: { status: "submitted" },
          },
          policy: [],
          security: [],
        },
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <Tabs value="compliance" onValueChange={() => {}}>
          <Compliance contractId="msa-1" isActive />
        </Tabs>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Compliance & Security Details"),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.queryByText("Loading compliance data..."),
      ).not.toBeInTheDocument(),
    );

    expect(
      screen.queryByRole("button", { name: "Submit Policies" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Contract Security" }));
    expect(
      screen.queryByRole("button", { name: "Submit Security" }),
    ).not.toBeInTheDocument();
  });

  it("shows approve/reject only for contract_manager", async () => {
    mockedUserRole = {
      userRole: "contract_manager",
      isVendor: false,
      isProjectManager: false,
      isApprover: false,
      isManager: true,
      isAdmin: false,
      isViewOnly: false,
    };

    getRequestMock.mockResolvedValue({
      data: {
        data: {
          details: {
            policyStatus: { status: "submitted", files: [{ name: "policy.pdf" }] },
            securityStatus: { status: "submitted" },
          },
          policy: [],
          security: [],
        },
      },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <Tabs value="compliance" onValueChange={() => {}}>
          <Compliance contractId="msa-1" isActive />
        </Tabs>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Compliance & Security Details"),
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.queryByText("Loading compliance data..."),
      ).not.toBeInTheDocument(),
    );

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });
});
