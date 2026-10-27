import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import * as XLSX from "xlsx";
import ActionLogTabContent from "../layouts/ActionLogTabContent";
import { contractManagerApi } from "../api/contractManagerApi";

const TOTAL = 55;
const PAGE_SIZE = 20;

vi.mock("@/hooks/useUserRole", () => ({
  useUserRole: () => ({ isManager: true, isProcurement: false, isAdmin: false }),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: "c1" }),
}));

vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/layouts/DataTable", () => ({
  DataTable: () => null,
}));

vi.mock("../components/ActionLogDetailsSheet", () => ({
  default: () => null,
}));

vi.mock("../api/contractManagerApi", () => ({
  contractManagerApi: { listLogs: vi.fn() },
}));

vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

const makeLogs = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    _id: `id${i}`,
    logId: `ACT-${i}`,
    module: "contract",
    description: `desc ${i}`,
    user: { name: "User" },
    actor: { name: "Manager" },
    reference: `REF-${i}`,
    date: new Date("2026-10-01T12:00:00Z").toISOString(),
  }));

const listLogsMock = vi.mocked(contractManagerApi.listLogs);

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ActionLogTabContent isActive />
    </QueryClientProvider>,
  );
}

describe("QA #135 — Action Log export covers all pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The table query fetches one page (limit 20); a request with the full
    // limit returns every row. The handler must use the latter for export.
    listLogsMock.mockImplementation((_id: string, q?: { limit?: number }) => {
      const limit = q?.limit ?? PAGE_SIZE;
      const count = limit >= TOTAL ? TOTAL : Math.min(limit, PAGE_SIZE);
      return Promise.resolve({
        data: { logs: makeLogs(count), total: TOTAL },
      }) as ReturnType<typeof contractManagerApi.listLogs>;
    });
  });

  test("Export requests the full set (limit = total) and writes every row", async () => {
    renderTab();

    const exportBtn = await screen.findByTestId("action-log-export");
    await waitFor(() => expect(exportBtn).not.toBeDisabled());

    fireEvent.click(exportBtn);

    // A dedicated export request is made with page 1 and the total limit.
    await waitFor(() => {
      expect(listLogsMock).toHaveBeenCalledWith(
        "c1",
        expect.objectContaining({ page: 1, limit: TOTAL }),
      );
    });

    // The workbook is built from all TOTAL rows, not just the 20-row page.
    await waitFor(() => {
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    });
    const sheetArg = vi.mocked(XLSX.utils.json_to_sheet).mock.calls.at(-1)?.[0];
    expect(Array.isArray(sheetArg)).toBe(true);
    expect((sheetArg as unknown[]).length).toBe(TOTAL);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });
});
