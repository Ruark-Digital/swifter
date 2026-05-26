import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ComplianceSecurityTab from "../components/ComplianceSecurityTab";

let mockedUserRole = {
  userRole: "view_only",
  isVendor: false,
  isProjectManager: false,
  isApprover: false,
  isManager: false,
  isAdmin: false,
};

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useParams: () => ({ id: "contract-1" }),
  };
});

vi.mock("@/hooks/useUserRole", () => {
  return {
    useUserRole: () => mockedUserRole,
  };
});

vi.mock("@/components/layouts/DataTable", () => {
  return {
    DataTable: ({ data }: { data: any[] }) => (
      <div>
        {data.map((row, i) => (
          <div key={i}>
            {Object.values(row).map((v, j) => (
              <span key={j}>{String(v)}</span>
            ))}
          </div>
        ))}
      </div>
    ),
  };
});

vi.mock("../components/SubmitPolicyDialog", () => {
  return { default: ({ trigger }: { trigger: any }) => trigger };
});

vi.mock("../components/ComplianceDetailsSheet", () => {
  return {
    default: ({ trigger }: { trigger: any }) => trigger,
  };
});

describe("Compliance & Security", () => {
  it("shows submit policies button only when policy status is pending or rejected for vendor/project manager", async () => {
    mockedUserRole = {
      userRole: "vendor",
      isVendor: true,
      isProjectManager: false,
      isApprover: false,
      isManager: false,
      isAdmin: false,
    };

    const baseProps = {
      basePath: "/contract/vendor/contracts/contract-1/compliance",
      data: {
        details: {
          policyStatus: { status: "submitted" },
          securityStatus: { status: "pending" },
        },
        policy: [],
        security: [],
      } as any,
    };

    const queryClient = new QueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ComplianceSecurityTab {...baseProps} />
      </QueryClientProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Submit Policies" }),
    ).not.toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <ComplianceSecurityTab
          {...baseProps}
          data={
            {
              ...baseProps.data,
              details: { ...baseProps.data.details, policyStatus: { status: "pending" } },
            } as any
          }
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Submit Policies" }),
    ).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={queryClient}>
        <ComplianceSecurityTab
          {...baseProps}
          data={
            {
              ...baseProps.data,
              details: { ...baseProps.data.details, policyStatus: { status: "rejected" } },
            } as any
          }
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Submit Policies" }),
    ).toBeInTheDocument();
  });

  it("shows submit security button only when security status is pending or rejected for vendor/project manager", async () => {
    mockedUserRole = {
      userRole: "project_manager",
      isVendor: false,
      isProjectManager: true,
      isApprover: false,
      isManager: false,
      isAdmin: false,
    };

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ComplianceSecurityTab
          basePath="/contract/vendor/contracts/contract-1/compliance"
          data={
            {
              details: {
                policyStatus: { status: "pending" },
                securityStatus: { status: "approved" },
              },
              policy: [],
              security: [],
            } as any
          }
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Contract Security" }));

    expect(
      screen.queryByRole("button", { name: "Submit Security" }),
    ).not.toBeInTheDocument();
  });

  it("shows approve/reject only for contract_manager", async () => {
    const queryClient = new QueryClient();

    mockedUserRole = {
      userRole: "contract_manager",
      isVendor: false,
      isProjectManager: false,
      isApprover: false,
      isManager: true,
      isAdmin: false,
    };

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <ComplianceSecurityTab
          basePath="/contract/manager/contracts/contract-1/compliance"
          data={
            {
              details: {
                policyStatus: { status: "submitted", files: [{ name: "policy.pdf" }] },
                securityStatus: { status: "submitted" },
              },
              policy: [],
              security: [],
            } as any
          }
        />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();

    mockedUserRole = {
      userRole: "approver",
      isVendor: false,
      isProjectManager: false,
      isApprover: true,
      isManager: false,
      isAdmin: false,
    };

    rerender(
      <QueryClientProvider client={queryClient}>
        <ComplianceSecurityTab
          basePath="/contract/approver/contracts/contract-1/compliance"
          data={
            {
              details: {
                policyStatus: { status: "submitted", files: [{ name: "policy.pdf" }] },
                securityStatus: { status: "submitted" },
              },
              policy: [],
              security: [],
            } as any
          }
        />
      </QueryClientProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reject" }),
    ).not.toBeInTheDocument();
  });

  it("shows security id in the security table", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ComplianceSecurityTab
          basePath="/contract/manager/contracts/contract-1/compliance"
          data={
            {
              details: {
                coverage: 1,
                security: true,
                expDate: "2026-01-01T00:00:00.000Z",
                securityType: [{ id: "st-1", name: "Bond" }],
              },
              policy: [],
              security: [
                {
                  _id: "sec-1",
                  securityTypeId: "SEC-001",
                  securityType: "Bond",
                  amount: 5000,
                  dueDate: "2026-06-01T00:00:00.000Z",
                  status: "Pending",
                } as any,
              ],
            } as any
          }
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Contract Security" }));
    const securityIds = await screen.findAllByText("SEC-001");
    expect(securityIds.length).toBeGreaterThan(0);
  });

  it("renders Security Details sheet using security id and amount/due date", async () => {
    const actual = await vi.importActual<
      typeof import("../components/ComplianceDetailsSheet")
    >("../components/ComplianceDetailsSheet");
    const ComplianceDetailsSheet = actual.default;

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <ComplianceDetailsSheet
          trigger={<button>Open</button>}
          type="security"
          id="SEC-001"
          contractId=""
          basePath="/contract/manager/contracts/contract-1/compliance"
          data={
            {
              securityTypeId: "SEC-001",
              securityType: "Bond",
              amount: 5000,
              dueDate: "2026-06-01T00:00:00.000Z",
              status: "Pending",
            } as any
          }
        />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByText("Open"));

    expect(await screen.findByText("Security Details")).toBeInTheDocument();
    expect(screen.getByText("Security ID")).toBeInTheDocument();
    expect(screen.getByText("SEC-001")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("5,000")).toBeInTheDocument();
    expect(screen.getByText("Due Date")).toBeInTheDocument();
    expect(screen.getByText("01 Jun 2026")).toBeInTheDocument();
  });
});
