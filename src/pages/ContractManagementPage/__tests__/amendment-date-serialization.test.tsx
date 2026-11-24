import { describe, it, expect, vi, beforeEach } from "vitest";

// pdf.js (pulled in by the page module) reads DOMMatrix at import time.
vi.stubGlobal("DOMMatrix", class {});
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const postRequestMock = vi.fn();
const putRequestMock = vi.fn();

vi.mock("@/lib/axiosInstance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/axiosInstance")>(
    "@/lib/axiosInstance",
  );
  return {
    ...actual,
    postRequest: (...args: unknown[]) => postRequestMock(...args),
    putRequest: (...args: unknown[]) => putRequestMock(...args),
  };
});

vi.mock("@/hooks/useToaster", () => {
  return {
    useToastHandler: () => ({
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

vi.mock("@/components/layouts/FormInputs", () => {
  const TextInput = (props: any) => {
    const { name, value, onChange, onBlur, placeholder, disabled } = props;
    return (
      <input
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  };

  const TextArea = (props: any) => {
    const { name, value, onChange, onBlur, placeholder, disabled } = props;
    return (
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  };

  const TextDatePicker = (props: any) => {
    const { name, value, onChange, onBlur, placeholder, disabled } = props;
    return (
      <input
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  };

  const TextCurrencyInput = (props: any) => {
    const { name, value, onChange, onBlur, placeholder, disabled } = props;
    return (
      <input
        name={name}
        value={value ?? ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  };

  const TextFileUploader = () => null;

  return {
    TextInput,
    TextArea,
    TextDatePicker,
    TextCurrencyInput,
    TextFileUploader,
  };
});

const renderDialog = async (
  timeZone: string,
  props?: Record<string, unknown>,
) => {
  const { DateTimeZoneProvider } = await import("@/hooks/useDateTimeZone");
  const { CreateAmendmentDialog } = await import(
    "../layouts/AmendmentsTabContent"
  );
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const utils = render(
    <QueryClientProvider client={qc}>
      <DateTimeZoneProvider timeZone={timeZone}>
        <CreateAmendmentDialog
          contractId="c1"
          trigger={<button type="button">Open</button>}
          {...props}
        />
      </DateTimeZoneProvider>
    </QueryClientProvider>,
  );

  fireEvent.click(utils.getByText("Open"));
  return utils;
};

const setInputValue = (root: HTMLElement, name: string, value: string) => {
  const el = root.querySelector(`[name="${name}"]`) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | null;
  if (!el) {
    throw new Error(`Missing input with name=${name}`);
  }
  fireEvent.change(el, { target: { value } });
};

const timeChangeFor = async (timeZone: string, pickedDate: string) => {
  const { getByRole } = await renderDialog(timeZone);
  const root = document.body;
  setInputValue(root, "amendmentTitle", "T1");
  setInputValue(root, "description", "D1");
  fireEvent.click(getByRole("button", { name: "Time & Cost Impact" }));
  await waitFor(() =>
    expect(root.querySelector(`input[name="costImpactAmount"]`)).toBeTruthy(),
  );
  setInputValue(root, "timeImpactDays", pickedDate);
  setInputValue(root, "costImpactAmount", "100");
  fireEvent.click(getByRole("button", { name: "Create Amendment" }));
  await waitFor(() => expect(postRequestMock).toHaveBeenCalledTimes(1));
  const payload = postRequestMock.mock.calls[0][0].payload;
  return payload.changes.find((c: { field: string }) => c.field === "time");
};

describe("Amendment date is sent in the contract timezone (QA-044)", () => {
  beforeEach(() => {
    postRequestMock.mockReset();
    postRequestMock.mockResolvedValue({ data: { message: "ok", data: {} } });
  });

  it.each([
    ["America/Toronto", "2026-05-20", "2026-05-20T00:00:00.000-04:00"],
    ["America/Toronto", "2026-12-20", "2026-12-20T00:00:00.000-05:00"],
    ["Pacific/Pago_Pago", "2026-05-20", "2026-05-20T00:00:00.000-11:00"],
    ["Pacific/Kiritimati", "2026-05-20", "2026-05-20T00:00:00.000+14:00"],
    ["Asia/Kolkata", "2026-05-20", "2026-05-20T00:00:00.000+05:30"],
    ["UTC", "2026-05-20", "2026-05-20T00:00:00.000+00:00"],
  ])("%s %s -> %s", async (tz, picked, expected) => {
    const change = await timeChangeFor(tz, picked);
    expect(change).toEqual({ field: "time", value: expected });
  });
});
