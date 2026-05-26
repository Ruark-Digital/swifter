import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import SubmitCapaDialog from "../components/SubmitCapaDialog";
import { postRequest } from "@/lib/axiosInstance";

const resetMock = vi.hoisted(() => vi.fn());
const setValueMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/axiosInstance", () => ({
  postRequest: vi.fn(),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogClose: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    type = "button",
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type={type} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/layouts/FormInputs", () => ({
  TextArea: () => null,
  TextDatePicker: () => null,
  TextFileUploader: () => null,
  TextInput: () => null,
}));

vi.mock("@/lib/forge", () => ({
  Forge: ({
    children,
    onSubmit,
  }: {
    children: React.ReactNode;
    onSubmit: (data: {
      title: string;
      timeline?: string;
      description?: string;
      files: File[] | null;
    }) => void;
  }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title: "CAPA response",
          timeline: "2026-06-01",
          description: "Corrective plan",
          files: null,
        });
      }}
    >
      {children}
    </form>
  ),
  Forger: () => null,
  useForge: () => ({
    control: {},
    reset: resetMock,
    setValue: setValueMock,
  }),
}));

vi.mock("react-hook-form", () => ({
  useWatch: () => null,
}));

vi.mock("@/lib/fileUtils", () => ({
  formatFileSize: (size: number) => `${size} B`,
}));

const mockedPostRequest = vi.mocked(postRequest);

const renderSubmitCapaDialog = (queryClient: QueryClient) => {
  render(
    <QueryClientProvider client={queryClient}>
      <SubmitCapaDialog
        contractId="msa-ncr-contract"
        ncrId="ncr-123"
        ncrTitle="NCR title"
        basePath="/contract/vendor/msa-contracts/msa-ncr-contract/ncrs"
        listInvalidateQueryKey={[
          "msaNcrs",
          "msa-ncr-contract",
          0,
          10,
          "/contract/vendor/msa-contracts/msa-ncr-contract/ncrs",
        ]}
        statsInvalidateQueryKey={[
          "msaNcrs",
          "stats",
          "msa-ncr-contract",
          "/contract/vendor/msa-contracts/msa-ncr-contract/ncrs",
        ]}
        trigger={<button type="button">Open CAPA</button>}
      />
    </QueryClientProvider>,
  );
};

describe("SubmitCapaDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPostRequest.mockResolvedValue({ data: { data: {} } });
  });

  test("invalidates supplied NCR list and stats keys after CAPA submission", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderSubmitCapaDialog(queryClient);

    fireEvent.click(screen.getByRole("button", { name: "Send Response" }));

    await waitFor(() => {
      expect(mockedPostRequest).toHaveBeenCalledWith({
        url: "/contract/vendor/msa-contracts/msa-ncr-contract/ncrs/ncr-123/capa",
        payload: {
          title: "CAPA response",
          timeline: "2026-06-01",
          description: "Corrective plan",
          files: undefined,
        },
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [
          "contractNcrs",
          "detail",
          "msa-ncr-contract",
          "ncr-123",
        ],
      });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [
        "msaNcrs",
        "msa-ncr-contract",
        0,
        10,
        "/contract/vendor/msa-contracts/msa-ncr-contract/ncrs",
      ],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [
        "msaNcrs",
        "stats",
        "msa-ncr-contract",
        "/contract/vendor/msa-contracts/msa-ncr-contract/ncrs",
      ],
    });
    expect(resetMock).toHaveBeenCalled();
  });
});
