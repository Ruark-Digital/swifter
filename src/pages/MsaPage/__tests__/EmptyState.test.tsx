import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import EmptyState from "../components/EmptyState";

const role = {
  isManager: false,
  isApprover: true,
  isVendor: false,
  isProjectManager: false,
};

vi.mock("@/hooks/useUserRole", () => {
  return {
    useUserRole: () => role,
  };
});

vi.mock("../layouts/CreateMSADialog", () => ({
  default: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

const CREATE_PROMPT = /Click the button below to create your first MSA/;

const setRole = (overrides: Partial<typeof role>) =>
  Object.assign(role, {
    isManager: false,
    isApprover: false,
    isVendor: false,
    isProjectManager: false,
    ...overrides,
  });

describe("MsaPage EmptyState", () => {
  beforeEach(() => setRole({ isApprover: true }));

  it("hides Create MSA CTA for non-managers", () => {
    render(<EmptyState />);
    expect(screen.queryByTestId("create-msa-cta")).not.toBeInTheDocument();
  });

  it("shows the create prompt and CTA for managers", () => {
    setRole({ isManager: true });
    render(<EmptyState />);
    expect(screen.getByText(CREATE_PROMPT)).toBeInTheDocument();
    expect(screen.getByTestId("create-msa-cta")).toBeInTheDocument();
  });

  it("keeps the create prompt for other non-vendor roles", () => {
    render(<EmptyState />);
    expect(screen.getByText(CREATE_PROMPT)).toBeInTheDocument();
  });

  it.each([
    ["vendor", { isVendor: true }],
    ["vendor PM", { isProjectManager: true }],
  ])("hides the create prompt and CTA for %s (QA #189)", (_, overrides) => {
    setRole(overrides);
    render(<EmptyState />);
    expect(screen.getByText("No MSA Yet")).toBeInTheDocument();
    expect(screen.queryByText(CREATE_PROMPT)).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-msa-cta")).not.toBeInTheDocument();
  });
});
