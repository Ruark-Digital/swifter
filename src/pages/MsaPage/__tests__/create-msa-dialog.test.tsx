import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateMSADialog from "../layouts/CreateMSADialog";

const getRequestMock = vi.fn();
const postRequestMock = vi.fn();

vi.mock("@/hooks/useUserQueryKey", () => {
  return {
    useUserQueryKey: (value: unknown) => value,
  };
});

vi.mock("@/hooks/useToaster", () => {
  return {
    useToastHandler: () => ({ success: vi.fn(), error: vi.fn() }),
  };
});

vi.mock("@/store/authSlice", () => {
  return {
    useUser: () => ({ currency: "CAD" }),
  };
});

vi.mock("@/lib/currencyUtils", () => {
  return {
    getExchangeRate: vi.fn(),
  };
});

vi.mock("@/lib/axiosInstance", () => {
  return {
    getRequest: (...args: any[]) => getRequestMock(...args),
    postRequest: (...args: any[]) => postRequestMock(...args),
  };
});

vi.mock("../components/Step1BasicInfo", () => {
  return { default: () => <div>Step1</div> };
});

vi.mock("../components/Step2ContractTeam", () => {
  return { default: () => <div>Step2</div> };
});

vi.mock("../components/Step3Timeline", () => {
  return { default: () => <div>Step3</div> };
});

vi.mock("../components/Step4Deliverables", () => {
  return { default: () => <div>Step4</div> };
});

vi.mock("../components/Step5ValuePayments", () => {
  return { default: () => <div>Step5</div> };
});

vi.mock("../components/Step6ComplianceSecurity", () => {
  return { default: () => <div>Step6</div> };
});

vi.mock("../components/Step7Documents", () => {
  return { default: () => <div>Step7</div> };
});

vi.mock("../components/Step8ApprovalLevel", () => {
  return { default: () => <div>Step8</div> };
});

vi.mock("../components/Step9ReviewPublish", () => {
  return { default: () => <div>Step9</div> };
});

describe("CreateMSADialog", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    postRequestMock.mockReset();
    getRequestMock.mockResolvedValue({ data: { data: [] } });
  });

  it("uses wider default max-width (non-step-8)", async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateMSADialog trigger={<button type="button">Open</button>} />
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toContain("sm:max-w-[580px]");
  });
});

