import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import SendApprovalDialog from "../components/SendApprovalDialog";
import { getRequest, postRequest } from "@/lib/axiosInstance";

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
  postRequest: vi.fn(),
}));

vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react");

  const DialogContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  } | null>(null);

  const useDialogContext = () => {
    const value = React.useContext(DialogContext);
    if (!value) {
      throw new Error("Dialog context missing");
    }
    return value;
  };

  return {
    Dialog: ({
      open,
      onOpenChange,
      children,
    }: {
      open: boolean;
      onOpenChange: (open: boolean) => void;
      children: React.ReactNode;
    }) => (
      <DialogContext.Provider value={{ open, onOpenChange }}>
        {children}
      </DialogContext.Provider>
    ),
    DialogTrigger: ({
      children,
    }: {
      children: React.ReactElement<{ onClick?: () => void }>;
      asChild?: boolean;
    }) => {
      const { onOpenChange } = useDialogContext();
      return React.cloneElement(children, {
        onClick: () => onOpenChange(true),
      });
    },
    DialogContent: ({ children }: { children: React.ReactNode }) => {
      const { open } = useDialogContext();
      return open ? <div>{children}</div> : null;
    },
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <button type="button" data-value={value}>
      {children}
    </button>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
}));

const mockedGetRequest = vi.mocked(getRequest);
const mockedPostRequest = vi.mocked(postRequest);

const renderDialog = (
  props?: Partial<React.ComponentProps<typeof SendApprovalDialog>>,
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <SendApprovalDialog
        contractId="contract-123"
        trigger={<button type="button">Open dialog</button>}
        {...props}
      />
    </QueryClientProvider>,
  );
};

describe("SendApprovalDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRequest.mockResolvedValue({
      data: {
        data: [],
      },
    } as never);
    mockedPostRequest.mockResolvedValue({ data: {} } as never);
  });

  test("loads approvers from the contract endpoint by default", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith({
        url: "/contract/manager/contracts/contract-123/approvers",
      });
    });
  });

  test("allows overriding the approver pool endpoint when needed", async () => {
    renderDialog({
      approverPoolPath: "/contract/manager/msa-contracts/contract-123/approvers",
    });

    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith({
        url: "/contract/manager/msa-contracts/contract-123/approvers",
      });
    });
  });
});
