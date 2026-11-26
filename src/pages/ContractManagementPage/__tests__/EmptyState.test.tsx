import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import EmptyState from "../components/EmptyState";

const role = { isManager: false };

vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => role }));
vi.mock("../components/CreateContractSheet", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

describe("Contracts EmptyState (create only for contract_manager / procurement)", () => {
  beforeEach(() => {
    role.isManager = false;
  });

  it("shows the creation prompt and CTA for managers, without 'proposals' wording", () => {
    role.isManager = true;
    render(<EmptyState />);
    expect(screen.getByText("No Contracts Yet")).toBeInTheDocument();
    expect(screen.getByTestId("create-contract-cta")).toBeInTheDocument();
    expect(screen.queryByText(/proposals/i)).not.toBeInTheDocument();
  });

  it("hides the CTA when a manager's table is read-only", () => {
    role.isManager = true;
    render(<EmptyState isReadOnly />);
    expect(screen.queryByTestId("create-contract-cta")).not.toBeInTheDocument();
  });

  it("shows a neutral message and no create entry points for other roles", () => {
    render(<EmptyState />);
    expect(screen.getByText("No contracts available")).toBeInTheDocument();
    expect(screen.getByText("There are no contracts to show yet.")).toBeInTheDocument();
    expect(screen.queryByTestId("create-contract-cta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-contract-icon")).not.toBeInTheDocument();
  });
});
