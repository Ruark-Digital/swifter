import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ActionLogTabContent from "../layouts/ActionLogTabContent";
import { getRequest } from "@/lib/axiosInstance";

const mockedWriteFile = vi.fn();

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => key,
}));

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
}));

vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({ sheet: true })),
    book_new: vi.fn(() => ({ workbook: true })),
    book_append_sheet: vi.fn(),
  },
  writeFile: (...args: unknown[]) => mockedWriteFile(...args),
}));

vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/layouts/DataTable", () => ({
  DataTable: () => <div data-testid="action-log-table" />,
}));

const mockedGetRequest = vi.mocked(getRequest);

const renderActionLog = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ActionLogTabContent contractId="msa-456" isActive />
    </QueryClientProvider>,
  );
};

describe("MSA Action Log export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRequest.mockResolvedValue({
      data: {
        data: {
          logs: [
            {
              _id: "log-1",
              logId: "ACT-001",
              module: "deliverables",
              description: "Approved deliverable",
              user: { name: "Alex Manager" },
              actor: { name: "contract_manager" },
              reference: { deliverableId: "DEL-001", _id: "DEL-001" },
              date: "2026-07-09T12:00:00.000Z",
            },
          ],
          total: 1,
        },
      },
    } as never);
  });

  test("exports the MSA action log to xlsx", async () => {
    renderActionLog();

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith({
        url: "/contract/manager/msa-contracts/msa-456/logs",
        config: {
          params: {
            page: 1,
            limit: 20,
            logId: undefined,
            module: undefined,
          },
        },
      });
    });

    const exportButton = await screen.findByRole("button", { name: "Export" });
    expect(exportButton).toBeEnabled();

    fireEvent.click(exportButton);

    expect(mockedWriteFile).toHaveBeenCalledTimes(1);
    expect(mockedWriteFile.mock.calls[0]?.[1]).toMatch(/^msa-action-log-msa-456-/);
  });
});
