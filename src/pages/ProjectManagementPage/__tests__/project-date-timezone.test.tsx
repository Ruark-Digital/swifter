import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CreateProjectDialog from "../components/CreateProjectDialog";

// Projects have no timezone of their own, so dates use the logged-in user's.
let userTimeZone: string | undefined;
vi.mock("@/store/authSlice", () => ({
  useUser: () => ({ timezone: userTimeZone, currency: "USD" }),
}));
vi.mock("@/lib/axiosInstance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/axiosInstance")>(
    "@/lib/axiosInstance",
  );
  return { ...actual, getRequest: vi.fn().mockResolvedValue({ data: { data: [] } }) };
});

const submitWith = async (timeZone: string, start: Date, end: Date) => {
  userTimeZone = timeZone;
  const onSubmit = vi.fn();
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <CreateProjectDialog
        open
        onOpenChange={() => {}}
        onSuccess={() => {}}
        submitButtonText="Save"
        isSubmitting={false}
        onSubmit={onSubmit}
        initialValues={{
          name: "P1",
          category: "Construction",
          startDate: start,
          endDate: end,
        }}
      />
    </QueryClientProvider>,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Save" }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  return onSubmit.mock.calls[0][0] as { startDate?: string; endDate?: string };
};

describe("Project dates are sent in the user's timezone (QA-044)", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["America/Toronto", "2027-01-25T00:00:00.000-05:00", "2027-07-25T00:00:00.000-04:00"],
    ["Pacific/Pago_Pago", "2027-01-25T00:00:00.000-11:00", "2027-07-25T00:00:00.000-11:00"],
    ["Pacific/Kiritimati", "2027-01-25T00:00:00.000+14:00", "2027-07-25T00:00:00.000+14:00"],
    ["UTC", "2027-01-25T00:00:00.000+00:00", "2027-07-25T00:00:00.000+00:00"],
  ])("%s", async (tz, startISO, endISO) => {
    // The pickers yield local-midnight Dates for the chosen calendar day.
    const payload = await submitWith(tz, new Date(2027, 0, 25), new Date(2027, 6, 25));
    expect(payload.startDate).toBe(startISO);
    expect(payload.endDate).toBe(endISO);
  });
});
