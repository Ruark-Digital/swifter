import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RenewSubscriptionDialog } from "../RenewSubscriptionDialog";

const postRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/axiosInstance")>(
    "@/lib/axiosInstance",
  );
  return {
    ...actual,
    postRequest: (...args: unknown[]) => postRequestMock(...args),
  };
});

const successMock = vi.fn();
const errorMock = vi.fn();
vi.mock("@/hooks/useToaster", () => ({
  useToastHandler: () => ({ success: successMock, error: errorMock }),
}));

// Render with the dialog forced open (controlled) — Radix Dialog triggers do
// not reliably open via fireEvent in jsdom, so we drive `open` directly, the
// same approach as ManageVendorAccessDialog's test.
const renderDialog = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RenewSubscriptionDialog
        subscriptionId="sub-1"
        companyId="comp-1"
        currentExpiry="2026-12-01T00:00:00.000Z"
        open
        onOpenChange={() => {}}
      />
    </QueryClientProvider>,
  );
};

describe("RenewSubscriptionDialog", () => {
  beforeEach(() => {
    postRequestMock.mockReset();
    successMock.mockReset();
    errorMock.mockReset();
  });

  it("renews with the default 30-day duration via POST /subscriptions/{id}/renew", async () => {
    postRequestMock.mockResolvedValue({ data: { message: "ok" } });
    renderDialog();

    // Dialog is open (controlled).
    await screen.findByTestId("renewal-duration-select");

    fireEvent.click(
      screen.getByRole("button", { name: "Renew Subscription" }),
    );

    await waitFor(() => {
      expect(postRequestMock).toHaveBeenCalledWith({
        url: "/subscriptions/sub-1/renew",
        payload: { durationInDays: 30 },
      });
    });
    expect(successMock).toHaveBeenCalled();
  });

  it("surfaces the backend message on failure", async () => {
    postRequestMock.mockRejectedValue({
      response: { data: { message: "Subscription not found" } },
    });
    renderDialog();

    await screen.findByTestId("renewal-duration-select");
    fireEvent.click(
      screen.getByRole("button", { name: "Renew Subscription" }),
    );

    await waitFor(() => {
      expect(errorMock).toHaveBeenCalledWith(
        "Renewal Failed",
        "Subscription not found",
      );
    });
  });
});
