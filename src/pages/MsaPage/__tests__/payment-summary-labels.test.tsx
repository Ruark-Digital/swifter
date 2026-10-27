import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import PaymentSummary from "../layouts/PaymentSummary";
import { getRequest } from "@/lib/axiosInstance";

const mockedUserRole = vi.hoisted(() => ({
  isVendor: false,
  isProjectManager: false,
  isApprover: false,
  isViewOnly: false,
  isManager: true,
}));

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => mockedUserRole,
}));

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => key,
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
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

vi.mock("@/components/layouts/ExportReportSheet", () => ({
  ExportReportSheet: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/ContractManagementPage/components/PaymentSummaryMilestonesTable", () => ({
  default: () => <div data-testid="milestones-table" />,
}));

vi.mock("@/pages/ContractManagementPage/components/HoldbackDetailsSheet", () => ({
  default: () => <div />,
}));

vi.mock("../components/MsaReleaseHoldbackDialog", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

vi.mock("../components/MsaUpdateSavingsDialog", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

vi.mock("../components/LabelItem", () => ({
  LabelItem: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

const mockedGetRequest = vi.mocked(getRequest);

const renderPaymentSummary = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <PaymentSummary
        contractId="msa-123"
        isActive
        msa={{
          status: "publish",
          currency: "USD",
          contractValue: 1000,
          bookBalance: 250,
          paymentTerms: "pt-1",
          milestone: [],
        } as any}
      />
    </QueryClientProvider>,
  );
};

describe("MSA Payment Summary labels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockedUserRole, {
      isVendor: false,
      isProjectManager: false,
      isApprover: false,
      isViewOnly: false,
      isManager: true,
    });

    mockedGetRequest.mockImplementation(async ({ url }: { url: string }) => {
      if (url === "/contract/manager/payment-terms") {
        return {
          data: {
            data: [{ _id: "pt-1", name: "Net 30" }],
          },
        };
      }

      if (url.endsWith("/payment-holdbacks") || url.endsWith("/payment-savings")) {
        return { data: { data: [] } };
      }

      return { data: { data: [] } };
    });
  });

  test("maps payment term ids to readable labels", async () => {
    renderPaymentSummary();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith({
        url: "/contract/manager/payment-terms",
      });
    });

    expect(screen.getByText("Payment Term")).toBeInTheDocument();
    expect(await screen.findByText("Net 30")).toBeInTheDocument();
  });

  test("renders Book Balance from the MSA detail (QA #122)", async () => {
    renderPaymentSummary();

    expect(screen.getByText("Book Balance")).toBeInTheDocument();
    expect(screen.getByText("$250")).toBeInTheDocument();
  });
});
