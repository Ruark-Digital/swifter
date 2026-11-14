import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ModulesManagement from "../components/ModulesManagement";
import { getRequest } from "@/lib/axiosInstance";

vi.mock("@/lib/axiosInstance", () => ({
  getRequest: vi.fn().mockResolvedValue({ data: { data: {} } }),
  putRequest: vi.fn(),
}));
vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock("@/store/authSlice", () => ({
  // The BE populates companyId as the company object, not a bare id.
  useUser: () => ({ companyId: { _id: "company-123", name: "Acme" } }),
}));

describe("ModulesManagement portal settings request", () => {
  it("uses the company _id in the URL, not the company object", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ModulesManagement />
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(getRequest).toHaveBeenCalledWith({
        url: "/admins/portal-settings/company-123",
      }),
    );
    expect(getRequest).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("[object Object]") }),
    );
  });
});
