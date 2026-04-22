import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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

const renderDialog = async () => {
  const { CreateAmendmentDialog } = await import(
    "../layouts/AmendmentsTabContent"
  );
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const utils = render(
    <QueryClientProvider client={qc}>
      <CreateAmendmentDialog
        contractId="c1"
        trigger={<button type="button">Open</button>}
      />
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

describe("CreateAmendmentDialog payload", () => {
  beforeEach(() => {
    postRequestMock.mockReset();
    postRequestMock.mockResolvedValue({ data: { message: "ok", data: {} } });
  });

  it("sends a non-undefined `changes` array for time_cost impact", async () => {
    const { getByRole } = await renderDialog();
    const root = document.body;

    setInputValue(root, "amendmentTitle", "T1");
    setInputValue(root, "description", "D1");

    fireEvent.click(getByRole("button", { name: "Time & Cost Impact" }));

    await waitFor(() =>
      expect(
        document.body.querySelector(`input[name="costImpactAmount"]`),
      ).toBeTruthy(),
    );

    setInputValue(root, "timeImpactDays", "2026-05-20");

    const costInput = root.querySelector(
      `input[name="costImpactAmount"]`,
    ) as HTMLInputElement | null;
    if (!costInput) throw new Error("Missing cost input");
    fireEvent.change(costInput, { target: { value: "1234" } });

    fireEvent.click(getByRole("button", { name: "Create Amendment" }));

    await waitFor(() => expect(postRequestMock).toHaveBeenCalled());

    const createCall = postRequestMock.mock.calls.find(
      (call) =>
        typeof call?.[0] === "object" &&
        call[0] != null &&
        "url" in (call[0] as any) &&
        String((call[0] as any).url).includes("/amendments"),
    );
    expect(createCall).toBeTruthy();
    const payload = (createCall?.[0] as any).payload;
    expect(payload.changes).toBeDefined();
    expect(Array.isArray(payload.changes)).toBe(true);
    expect(payload.changes.length).toBeGreaterThan(0);
  });

  it("populates `changes` for cost impact", async () => {
    const { getByRole } = await renderDialog();
    const root = document.body;

    setInputValue(root, "amendmentTitle", "T2");
    setInputValue(root, "description", "D2");

    fireEvent.click(getByRole("button", { name: "Cost Impact" }));

    await waitFor(() =>
      expect(
        document.body.querySelector(`input[name="costImpactAmount"]`),
      ).toBeTruthy(),
    );

    const costInput = root.querySelector(
      `input[name="costImpactAmount"]`,
    ) as HTMLInputElement | null;
    if (!costInput) throw new Error("Missing cost input");
    fireEvent.change(costInput, { target: { value: "2000" } });

    fireEvent.click(getByRole("button", { name: "Create Amendment" }));

    await waitFor(() => expect(postRequestMock).toHaveBeenCalled());

    const createCall = postRequestMock.mock.calls.find(
      (call) =>
        typeof call?.[0] === "object" &&
        call[0] != null &&
        "url" in (call[0] as any) &&
        String((call[0] as any).url).includes("/amendments"),
    );
    expect(createCall).toBeTruthy();
    const payload = (createCall?.[0] as any).payload;
    expect(payload.changes).toEqual([{ field: "cost", value: 2000 }]);
  });

  it("populates `changes` for others impact when fields are enabled", async () => {
    const { getByRole } = await renderDialog();
    const root = document.body;

    setInputValue(root, "amendmentTitle", "T3");
    setInputValue(root, "description", "D3");

    fireEvent.click(getByRole("button", { name: "Other Combinations" }));

    await waitFor(() =>
      expect(document.body.querySelector(`input[name="scope"]`)).toBeTruthy(),
    );

    setInputValue(root, "scope", "Scope");
    setInputValue(root, "newExpiryDate", "2026-05-20");
    setInputValue(root, "otherCost", "500");

    fireEvent.click(getByRole("button", { name: "Create Amendment" }));

    await waitFor(() => expect(postRequestMock).toHaveBeenCalled());

    const createCall = postRequestMock.mock.calls.find(
      (call) =>
        typeof call?.[0] === "object" &&
        call[0] != null &&
        "url" in (call[0] as any) &&
        String((call[0] as any).url).includes("/amendments"),
    );
    expect(createCall).toBeTruthy();
    const payload = (createCall?.[0] as any).payload;
    expect(payload.changes).toEqual([
      { field: "scope", value: "Scope" },
      { field: "time", value: "2026-05-20" },
      { field: "cost", value: 500 },
    ]);
  });
});
