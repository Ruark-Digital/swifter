import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import EmptyState from "../components/EmptyState";

const role = { isManager: false };

vi.mock("@/hooks/useUserRole", () => ({ useUserRole: () => role }));
vi.mock("../layouts/CreateMSADialog", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

describe("MsaPage EmptyState (create only for contract_manager / procurement)", () => {
  beforeEach(() => {
    role.isManager = false;
  });

  it("shows the creation prompt and CTA for managers, without 'proposals' wording", () => {
    role.isManager = true;
    render(<EmptyState />);
    expect(screen.getByText("No MSA Yet")).toBeInTheDocument();
    expect(screen.getByText(/Click the button below to create your first MSA/)).toBeInTheDocument();
    expect(screen.getByTestId("create-msa-cta")).toBeInTheDocument();
    expect(screen.queryByText(/proposals/i)).not.toBeInTheDocument();
  });

  it("shows a neutral message and no CTA for every other role", () => {
    render(<EmptyState />);
    expect(screen.getByText("No MSAs available")).toBeInTheDocument();
    expect(screen.getByText("There are no MSAs to show yet.")).toBeInTheDocument();
    expect(screen.queryByText(/button below/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-msa-cta")).not.toBeInTheDocument();
  });
});
