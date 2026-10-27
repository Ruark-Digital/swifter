import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useExportProject } from "../hooks/useProjectApi";
import { postRequest } from "@/lib/axiosInstance";

// QA #294 — the project details "Export" must call the BE export endpoint
// (`POST /manager/projects/{projectId}/export`) and stream back a PDF/DOCX,
// not build a file client-side.
vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => key,
}));

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
  patchRequest: vi.fn(),
  postRequest: vi.fn(),
}));

const mockedPost = vi.mocked(postRequest);

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe("useExportProject (QA #294)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("POSTs to the BE project export endpoint requesting a PDF blob", async () => {
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    mockedPost.mockResolvedValue({ data: blob } as never);

    const { result } = renderHook(() => useExportProject("proj-1"), { wrapper });

    const returned = await result.current.mutateAsync("pdf");

    expect(returned).toBe(blob);
    expect(mockedPost).toHaveBeenCalledWith({
      url: "/contract/manager/projects/proj-1/export",
      payload: { exportType: "pdf" },
      config: { responseType: "blob" },
    });
  });

  it("passes docx as the requested export type", async () => {
    mockedPost.mockResolvedValue({ data: new Blob(["docx"]) } as never);

    const { result } = renderHook(() => useExportProject("proj-2"), { wrapper });

    await result.current.mutateAsync("docx");

    expect(mockedPost).toHaveBeenCalledWith({
      url: "/contract/manager/projects/proj-2/export",
      payload: { exportType: "docx" },
      config: { responseType: "blob" },
    });
  });
});
