import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import VendorPersonnelTabContent from "../layouts/VendorPersonnelTabContent";
import { getRequest, putRequest } from "@/lib/axiosInstance";

const mockedUserRole = vi.hoisted(() => ({
  isManager: false,
  isCompanyAdmin: false,
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
  putRequest: vi.fn(),
}));

// ConfirmAlert (real, unmocked) reads useSetReset transitively from the auth
// store even though this component's "Remove Personnel" flow never logs out.
vi.mock("@/store/authSlice", () => ({
  useSetReset: () => vi.fn(),
}));

vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedGetRequest = vi.mocked(getRequest);
const mockedPutRequest = vi.mocked(putRequest);

const EXISTING_PERSONNEL = [
  { _id: "p1", name: "Jane Vendor", email: "jane@vendor.com", phone: "", role: "" },
];

const renderTab = (props: Partial<React.ComponentProps<typeof VendorPersonnelTabContent>> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <VendorPersonnelTabContent
        contractId="contract-1"
        isActive
        owner
        status="active"
        contractType="Contract"
        {...props}
      />
    </QueryClientProvider>,
  );

  return queryClient;
};

describe("Vendor Personnel tab — status/owner gating and PUT wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockedUserRole, { isManager: false, isCompanyAdmin: false });
    mockedGetRequest.mockResolvedValue({ data: { data: EXISTING_PERSONNEL } } as any);
    mockedPutRequest.mockResolvedValue({ data: { message: "Saved" } } as any);
  });

  test("draft status, owner, manager: Add/Edit/Remove are absent", async () => {
    Object.assign(mockedUserRole, { isManager: true });
    renderTab({ status: "draft" });

    await screen.findByText("Jane Vendor");

    expect(screen.queryByRole("button", { name: /add personnel/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-personnel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("remove-personnel")).not.toBeInTheDocument();
  });

  test("active status, owner, manager: Add/Edit/Remove are present", async () => {
    Object.assign(mockedUserRole, { isManager: true });
    renderTab({ status: "active" });

    await screen.findByText("Jane Vendor");

    expect(screen.getByRole("button", { name: /add personnel/i })).toBeInTheDocument();
    expect(screen.getByTestId("edit-personnel")).toBeInTheDocument();
    expect(screen.getByTestId("remove-personnel")).toBeInTheDocument();
  });

  test("publish status, owner, company-admin (non-manager): Add/Edit/Remove are present", async () => {
    Object.assign(mockedUserRole, { isManager: false, isCompanyAdmin: true });
    renderTab({ status: "publish" });

    await screen.findByText("Jane Vendor");

    expect(screen.getByRole("button", { name: /add personnel/i })).toBeInTheDocument();
    expect(screen.getByTestId("edit-personnel")).toBeInTheDocument();
    expect(screen.getByTestId("remove-personnel")).toBeInTheDocument();
  });

  test("active status, non-owner, manager: Add Personnel is absent", async () => {
    Object.assign(mockedUserRole, { isManager: true });
    renderTab({ status: "active", owner: false });

    await screen.findByText("Jane Vendor");

    expect(screen.queryByRole("button", { name: /add personnel/i })).not.toBeInTheDocument();
  });

  test("Contract type: Save PUTs to /contract/manager/contracts/{id}/vendor-personnel with a personnel array", async () => {
    Object.assign(mockedUserRole, { isManager: true });
    renderTab({ status: "active", contractType: "Contract" });

    await screen.findByText("Jane Vendor");

    fireEvent.click(screen.getByRole("button", { name: /add personnel/i }));

    fireEvent.change(screen.getByPlaceholderText("Full name"), {
      target: { value: "New Person" },
    });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "new@person.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedPutRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/contracts/contract-1/vendor-personnel",
          payload: expect.objectContaining({
            personnel: expect.arrayContaining([
              expect.objectContaining({ name: "New Person", email: "new@person.com" }),
            ]),
          }),
        }),
      );
    });
  });

  test("MsaContract type: Save PUTs to /contract/manager/msa-contracts/{id}/vendor-personnel", async () => {
    Object.assign(mockedUserRole, { isManager: true });
    renderTab({ status: "active", contractType: "MsaContract" });

    await screen.findByText("Jane Vendor");

    fireEvent.click(screen.getByRole("button", { name: /add personnel/i }));

    fireEvent.change(screen.getByPlaceholderText("Full name"), {
      target: { value: "New Person" },
    });
    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "new@person.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockedPutRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/msa-contracts/contract-1/vendor-personnel",
          payload: expect.objectContaining({
            personnel: expect.arrayContaining([
              expect.objectContaining({ name: "New Person", email: "new@person.com" }),
            ]),
          }),
        }),
      );
    });
  });
});
