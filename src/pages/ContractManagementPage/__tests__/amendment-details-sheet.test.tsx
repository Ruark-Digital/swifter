import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AmendmentsTable from "../components/AmendmentsTable";
import { getRequest, patchRequest, postRequest } from "@/lib/axiosInstance";

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
  patchRequest: vi.fn(),
  postRequest: vi.fn(),
}));

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => key,
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const mockUserRole = {
  isVendor: false,
  isProjectManager: false,
  isManager: false,
  isApprover: false,
};

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => mockUserRole,
}));

vi.mock("@/components/layouts/DataTable", () => ({
  DataTable: ({ data, columns }: any) => (
    <div>
      {data.map((row: any) => (
        <div key={row.id}>
          {columns.map((column: any, index: number) => {
            if (!column.cell) {
              return null;
            }

            const value = column.accessorKey ? row[column.accessorKey] : undefined;

            return (
              <div key={`${row.id}-${index}`}>
                {column.cell({
                  getValue: () => value,
                  row: { original: row },
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/ui/DocumentViewer", () => ({
  DocumentViewer: () => null,
}));

vi.mock("../components/DocumentItem", () => ({
  DocumentItem: ({ d }: any) => <div>{d.name}</div>,
}));

vi.mock("@/components/ui/sheet", async () => {
  const React = await import("react");

  const SheetContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  } | null>(null);

  const useSheetContext = () => {
    const value = React.useContext(SheetContext);
    if (!value) {
      throw new Error("Sheet context missing");
    }
    return value;
  };

  return {
    Sheet: ({
      open,
      onOpenChange,
      children,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      children: React.ReactNode;
    }) => (
      <SheetContext.Provider value={{ open, onOpenChange }}>
        {children}
      </SheetContext.Provider>
    ),
    SheetTrigger: ({
      children,
    }: {
      children: React.ReactElement<{ onClick?: () => void }>;
      asChild?: boolean;
    }) => {
      const { onOpenChange } = useSheetContext();
      return React.cloneElement(children, {
        onClick: () => onOpenChange(true),
      });
    },
    SheetContent: ({ children }: { children: React.ReactNode }) => {
      const { open } = useSheetContext();
      return open ? <div>{children}</div> : null;
    },
    SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SheetClose: ({
      children,
    }: {
      children: React.ReactElement<{ onClick?: () => void }>;
      asChild?: boolean;
    }) => {
      const { onOpenChange } = useSheetContext();
      return React.cloneElement(children, {
        onClick: () => onOpenChange(false),
      });
    },
  };
});

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react");

  const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  } | null>(null);

  const useDialogContext = () => React.useContext(DialogContext);

  return {
    Dialog: ({
      open = false,
      onOpenChange = () => {},
      children,
    }: {
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
      children: React.ReactNode;
    }) => (
      <DialogContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DialogContext.Provider>
    ),
    DialogTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
    DialogContent: ({ children }: { children: React.ReactNode }) => {
      const ctx = useDialogContext();
      return ctx?.open ? <div>{children}</div> : null;
    },
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode; value: string }) => (
    <button type="button">{children}</button>
  ),
  TabsContent: ({ children }: { children: React.ReactNode; value: string }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode; value: string }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

const mockedGetRequest = vi.mocked(getRequest);
const mockedPatchRequest = vi.mocked(patchRequest);
const mockedPostRequest = vi.mocked(postRequest);

const mockDetail = {
  _id: "amendment-1",
  contractRef: "contract-1",
  approverStatus: "pending",
  vendorStatus: "rejected",
  contractRefModel: "Contract",
  assignApprover: false,
  amendmentId: "AM-001",
  company: "company-1",
  status: "pending",
  title: "Schedule Adjustment",
  impact: "time",
  description: "Adjust the completion date.",
  changes: [
    {
      field: "time",
      oldValue: "2026-06-29T00:00:00.000Z",
      newValue: "2026-08-13T00:00:00.000Z",
      _id: "change-1",
    },
  ],
  submittedBy: { _id: "user-1", email: "submitter@test.com" },
  files: [],
  approvers: [],
  statusHistory: [],
  __v: 0,
};

const renderTable = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AmendmentsTable
        contractId="contract-1"
        basePath="/contract/manager/contracts/contract-1/amendments"
        rows={[
          {
            id: "amendment-1",
            amendmentId: "AM-001",
            amendmentTitle: "Schedule Adjustment",
            vendorStatus: "Rejected",
            status: "Pending",
          },
        ]}
      />
    </QueryClientProvider>,
  );
};

describe("Amendment details sheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockUserRole, {
      isVendor: false,
      isProjectManager: false,
      isManager: false,
      isApprover: false,
    });
    Object.assign(mockDetail, {
      approverStatus: "pending",
      vendorStatus: "rejected",
      status: "pending",
      comments: undefined,
    });
    mockedPatchRequest.mockResolvedValue({} as any);
    mockedPostRequest.mockResolvedValue({} as any);
    mockedGetRequest.mockImplementation(async ({ url }: { url: string }) => {
      if (url.endsWith("/amendment-1")) {
        return {
          data: {
            data: mockDetail,
          },
        } as any;
      }

      return { data: { data: [] } } as any;
    });
  });

  test("shows the amended expiry date only once for time-impact amendments", async () => {
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "View" }));

    await waitFor(() => {
      expect(screen.getByText("Amendment Details")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByText("Aug 13, 2026")).toHaveLength(1);
    });
  });

  test("sends vendor rejection comments when rejecting an amendment", async () => {
    Object.assign(mockUserRole, {
      isVendor: true,
      isProjectManager: false,
      isManager: false,
      isApprover: false,
    });
    Object.assign(mockDetail, {
      vendorStatus: "pending",
      status: "pending",
    });

    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "View" }));

    await waitFor(() => {
      expect(screen.getByText("Reject Amendment")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Reject Amendment" }));
    fireEvent.change(screen.getByPlaceholderText("Reason for rejection"), {
      target: { value: "Need the revised schedule explained." },
    });

    fireEvent.click(
      screen.getAllByRole("button", { name: "Reject Amendment" })[1],
    );

    await waitFor(() => {
      expect(mockedPatchRequest).toHaveBeenCalledWith({
        url: "/contract/manager/contracts/contract-1/amendments/amendment-1/status",
        payload: {
          status: "rejected",
          comments: "Need the revised schedule explained.",
        },
      });
    });
  });
});
