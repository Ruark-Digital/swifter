import { describe, it, expect, vi, beforeEach } from "vitest";
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

const renderDialog = async (props?: Record<string, unknown>) => {
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
        {...props}
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
    putRequestMock.mockReset();
    postRequestMock.mockResolvedValue({ data: { message: "ok", data: {} } });
    putRequestMock.mockResolvedValue({ data: { message: "ok", data: {} } });
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

  it("updates and resubmits the same amendment record in edit mode", async () => {
    const { getByRole } = await renderDialog({
      mode: "edit",
      amendmentId: "amendment-1",
      updatePath: "/contract/manager/contracts/c1/amendments/amendment-1",
      titleText: "Modify Amendment",
      submitText: "Resubmit Amendment",
      initialValues: {
        amendmentTitle: "Existing Amendment",
        impactType: "time",
        timeImpactDays: "2026-08-13",
        description: "Current description",
      },
      existingFiles: [
        {
          name: "existing-amendment.pdf",
          url: "https://example.com/existing-amendment.pdf",
          type: "application/pdf",
          size: "1024",
        },
      ],
    });
    const root = document.body;

    setInputValue(root, "description", "Updated description");

    fireEvent.click(getByRole("button", { name: "Resubmit Amendment" }));

    await waitFor(() => expect(putRequestMock).toHaveBeenCalled());

    expect(postRequestMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/contract/manager/contracts/c1/amendments/amendment-1",
      }),
    );

    expect(putRequestMock).toHaveBeenCalledWith({
      url: "/contract/manager/contracts/c1/amendments/amendment-1",
      payload: expect.objectContaining({
        title: "Existing Amendment",
        description: "Updated description",
        impact: "time",
        files: [
          {
            name: "existing-amendment.pdf",
            url: "https://example.com/existing-amendment.pdf",
            type: "application/pdf",
            size: "1024",
          },
        ],
      }),
    });
  });
});
