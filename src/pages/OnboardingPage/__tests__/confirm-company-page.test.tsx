import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ConfirmCompanyPage from "../ConfirmCompanyPage";

// Cross-company vendor invite: an already-onboarded vendor confirms joining a
// new company via a single-use token from their email link. The page hits the
// public GET /auth/vendor/confirm-company?token=... endpoint on mount.

const getRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/axiosInstance")>(
    "@/lib/axiosInstance",
  );
  return {
    ...actual,
    getRequest: (...args: unknown[]) => getRequestMock(...args),
  };
});

const renderAt = (entry: string) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[entry]}>
        <ConfirmCompanyPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("ConfirmCompanyPage (cross-company vendor invite)", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
  });

  it("confirms the invite with the token from the query string and shows success", async () => {
    getRequestMock.mockResolvedValue({
      data: {
        status: true,
        message: "OK",
        data: { message: "You have successfully joined the company as a vendor" },
      },
    });

    renderAt("/vendor/confirm-company?token=abc123");

    await waitFor(() => {
      expect(
        screen.getByText(/successfully joined the company/i),
      ).toBeInTheDocument();
    });

    // Endpoint + token forwarded exactly as the query param.
    expect(getRequestMock).toHaveBeenCalledTimes(1);
    const call = getRequestMock.mock.calls[0][0] as {
      url: string;
      config?: { params?: { token?: string } };
    };
    expect(call.url).toBe("/auth/vendor/confirm-company");
    expect(call.config?.params?.token).toBe("abc123");
  });

  it("does not call the endpoint when the token is missing and shows an invalid-link message", async () => {
    renderAt("/vendor/confirm-company");

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
    expect(getRequestMock).not.toHaveBeenCalled();
  });

  it("surfaces the backend message when the token is invalid or expired", async () => {
    getRequestMock.mockRejectedValue({
      response: { data: { message: "Invalid or expired token" } },
    });

    renderAt("/vendor/confirm-company?token=stale");

    await waitFor(() => {
      expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
    });
  });

  it("lets the user retry after a transient failure", async () => {
    getRequestMock
      .mockRejectedValueOnce({ response: { data: { message: "Network error" } } })
      .mockResolvedValueOnce({
        data: {
          status: true,
          message: "OK",
          data: {
            message: "You have successfully joined the company as a vendor",
          },
        },
      });

    renderAt("/vendor/confirm-company?token=abc123");

    // First attempt failed -> error state offers a retry.
    const retry = await screen.findByRole("button", { name: /try again/i });
    fireEvent.click(retry);

    await waitFor(() => {
      expect(
        screen.getByText(/successfully joined the company/i),
      ).toBeInTheDocument();
    });
    expect(getRequestMock).toHaveBeenCalledTimes(2);
  });
});
