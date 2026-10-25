import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import VendorEmptyState from "../components/VendorEmptyState";

// QA #189 — vendors and vendor PMs get this empty state on the contracts
// page; it must not prompt them to create a contract.
describe("ContractManagementPage VendorEmptyState", () => {
  it("has no create-contract prompt or CTA", () => {
    render(<VendorEmptyState />);
    expect(screen.getByText("No Contracts Yet")).toBeInTheDocument();
    expect(screen.queryByText(/create your first/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-contract-cta")).not.toBeInTheDocument();
  });
});
