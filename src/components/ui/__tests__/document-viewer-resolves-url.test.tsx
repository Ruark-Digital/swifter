import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { DocumentViewer } from "../DocumentViewer";

// Keep the heavy PDF renderer out of jsdom; the XLSX path never touches it.
vi.mock("react-pdf", () => ({
  Document: () => null,
  Page: () => null,
  pdfjs: { GlobalWorkerOptions: {}, version: "3.11.174" },
}));

// A minimal workbook so loadExcelFile completes without a real parse.
vi.mock("xlsx", () => ({
  read: () => ({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } }),
  utils: { sheet_to_json: () => [] },
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({ actualTheme: "light" }),
}));

describe("DocumentViewer URL resolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches the environment-resolved URL, not the raw stored host", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        arrayBuffer: async () => new ArrayBuffer(8),
      } as unknown as Response);

    // A stored URL that bakes in a *different* host but the same API base path.
    // resolveEnvFileUrl should re-home it onto the active environment origin.
    const rawUrl =
      "https://old-upload-host.example.com/api/v1/dev/upload/policy.xlsx";

    render(
      <DocumentViewer
        isOpen
        onClose={() => {}}
        fileUrl={rawUrl}
        fileName="policy.xlsx"
        fileType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />,
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const fetchedUrl = String(fetchMock.mock.calls[0][0]);
    // The raw cross-origin host must NOT be fetched (that's the "Failed to
    // fetch" CORS bug); the re-homed URL keeps the /upload/... path.
    expect(fetchedUrl).not.toContain("old-upload-host.example.com");
    expect(fetchedUrl).toContain("/upload/policy.xlsx");
  });
});
