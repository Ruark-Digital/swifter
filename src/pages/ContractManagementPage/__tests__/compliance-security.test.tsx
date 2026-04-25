import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ComplianceSecurityTab from "../components/ComplianceSecurityTab";

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
    useUserRole: () => ({
      isVendor: false,
      isManager: false,
      isAdmin: false,
    }),
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
  it("shows securityTypeId as Security ID in the security table", async () => {
    render(
      <ComplianceSecurityTab
        basePath="/contract/manager/contracts/contract-1/compliance"
        data={
          {
            details: {
              coverage: 1,
              security: true,
              expDate: "2026-01-01T00:00:00.000Z",
              securityType: [{ _id: "st-1", name: "Bond" }],
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
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Contract Security" }));
    expect(await screen.findByText("SEC-001")).toBeInTheDocument();
  });

  it("renders Security Details sheet using securityTypeId and amount/due date", async () => {
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
          id="sec-1"
          contractId=""
          basePath="/contract/manager/contracts/contract-1/compliance"
          data={
            {
              _id: "sec-1",
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
