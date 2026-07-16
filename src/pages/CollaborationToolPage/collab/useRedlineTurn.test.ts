import { describe, it, expect } from "vitest";
import { redlineSideFromRole } from "./useRedlineTurn";

const role = (over: Partial<{
  isManager: boolean;
  isVendor: boolean;
  isProjectManager: boolean;
}>) => ({
  isManager: false,
  isVendor: false,
  isProjectManager: false,
  ...over,
});

describe("redlineSideFromRole", () => {
  it("maps the company side (CM/Procurement) to 'manager'", () => {
    expect(redlineSideFromRole(role({ isManager: true }))).toBe("manager");
  });

  it("maps vendor to 'vendor'", () => {
    expect(redlineSideFromRole(role({ isVendor: true }))).toBe("vendor");
  });

  it("maps project manager to 'vendor' (PM acts on the vendor's behalf)", () => {
    expect(redlineSideFromRole(role({ isProjectManager: true }))).toBe("vendor");
  });

  it("returns null for non-participant roles (approver/view-only/admin)", () => {
    expect(redlineSideFromRole(role({}))).toBeNull();
  });

  it("prefers the company side when a role somehow reads as both", () => {
    // Defensive: manager wins so a mis-flagged role can't land on the vendor
    // endpoint. (Not expected in practice — roles are mutually exclusive.)
    expect(
      redlineSideFromRole(role({ isManager: true, isVendor: true })),
    ).toBe("manager");
  });
});
