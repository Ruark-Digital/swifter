import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import EmptyState from "../components/EmptyState";

vi.mock("@/hooks/useUserRole", () => {
  return {
    useUserRole: () => ({
      isManager: false,
      isApprover: true,
      isVendor: false,
    }),
  };
});

describe("MsaPage EmptyState", () => {
  it("hides Create MSA CTA for non-managers", () => {
    render(<EmptyState />);
    expect(screen.queryByTestId("create-msa-cta")).not.toBeInTheDocument();
  });
});

