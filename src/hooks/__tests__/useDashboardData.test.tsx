import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getRequest } from "@/lib/axiosInstance";
import { useDashboardData } from "../useDashboardData";

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn(),
}));

vi.mock("@/hooks/useUserQueryKey", () => ({
  useUserQueryKey: (key: unknown[]) => key,
}));

const mockedGetRequest = vi.mocked(getRequest);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetRequest.mockResolvedValue({ data: { data: [] } } as any);
  });

  test("requests AI insights for procurement from the contract manager dashboard endpoint", async () => {
    renderHook(() => useDashboardData("procurement"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockedGetRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "/contract/manager/contracts/dashboard/ai-insights",
          config: expect.objectContaining({
            params: expect.objectContaining({
              type: "Contract",
            }),
          }),
        }),
      );
    });
  });
});
