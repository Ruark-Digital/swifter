import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tabs } from "@/components/ui/tabs";
import ChangeManagement from "../layouts/ChangeManagement";

const changeTableProps = vi.fn();

vi.mock("@/pages/ContractManagementPage/components/ChangeTable", () => ({
  default: (props: { owner?: boolean }) => {
    changeTableProps(props);
    return null;
  },
}));
vi.mock("@/pages/ContractManagementPage/components/ChangeStatsCards", () => ({
  default: () => null,
}));
vi.mock("@/pages/ContractManagementPage/components/CreateChangeDialog", () => ({
  default: () => null,
}));
vi.mock("@/components/layouts/ExportReportSheet", () => ({
  ExportReportSheet: () => null,
}));
vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({
    isManager: true,
    isApprover: false,
    isAdmin: false,
    isViewOnly: false,
    isVendor: false,
    isProjectManager: false,
  }),
}));
vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn().mockResolvedValue({ data: { data: { changes: [] } } }),
}));

const renderTab = (owner?: boolean) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Tabs value="change">
        <ChangeManagement contractId="msa-1" isActive owner={owner} />
      </Tabs>
    </QueryClientProvider>,
  );

describe("MSA ChangeManagement owner gating", () => {
  beforeEach(() => changeTableProps.mockClear());

  it("passes owner to ChangeTable so the MSA owner can approve/reject", () => {
    renderTab(true);
    expect(changeTableProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ owner: true }),
    );
  });

  it("passes owner=false through for a manager who does not own the MSA", () => {
    renderTab(false);
    expect(changeTableProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ owner: false }),
    );
  });
});
