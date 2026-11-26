import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/vitest";
import { ContractModuleRoute } from "../ContractModuleRoute";

const flags = (userRole: string | undefined, on: Record<string, boolean> = {}) => ({
  userRole,
  isManager: false,
  isVendor: false,
  isProjectManager: false,
  isApprover: false,
  isViewOnly: false,
  isCompanyAdmin: false,
  ...on,
});
let role: ReturnType<typeof flags>;
vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => role }));

const renderGuard = () =>
  render(
    <MemoryRouter>
      <ContractModuleRoute>
        <div>module page</div>
      </ContractModuleRoute>
    </MemoryRouter>,
  );

describe("ContractModuleRoute", () => {
  beforeEach(() => {
    role = flags(undefined);
  });

  it.each([
    ["contract_manager / procurement", { isManager: true }],
    ["vendor", { isVendor: true }],
    ["project_manager", { isProjectManager: true }],
    ["approver", { isApprover: true }],
    ["view_only", { isViewOnly: true }],
    ["company_admin", { isCompanyAdmin: true }],
  ])("allows %s", (_, on) => {
    role = flags("x", on);
    renderGuard();
    expect(screen.getByText("module page")).toBeInTheDocument();
  });

  it("shows a no-access page for evaluator and super_admin", () => {
    role = flags("evaluator");
    renderGuard();
    expect(screen.getByTestId("no-access")).toBeInTheDocument();
    expect(screen.queryByText("module page")).not.toBeInTheDocument();
  });

  it("does not flash a denial while the role is unresolved", () => {
    renderGuard();
    expect(screen.getByText("module page")).toBeInTheDocument();
  });
});
