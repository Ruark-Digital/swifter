import { describe, expect, it } from "vitest";
import { buildPendingApprovalLine } from "../lib/contractAlerts";

describe("buildPendingApprovalLine", () => {
  it("uses the person's name when pendingWithRole is present (current payload)", () => {
    // Straight from the reported alerts payload — a 0-day invoice approval that
    // must still surface.
    const line = buildPendingApprovalLine(
      {
        entity: "invoice",
        id: "INV-001",
        status: "pending",
        daysWaiting: 0,
        pendingWith: "Man Wonder  Ap1",
        pendingWithRole: "approver",
        amount: 100,
      },
      (amount) => `$${amount}`,
    );
    expect(line).toBe("Invoice 001 is pending Man Wonder Ap1's approval ($100)");
  });

  it("keeps the legacy role phrasing when only pendingWith is set", () => {
    expect(
      buildPendingApprovalLine({
        entity: "change_directive",
        id: "CD-001",
        pendingWith: "approver",
      }),
    ).toBe("Change Directive 001 is pending approver approval");
  });

  it("falls back to a generic line without a responsible party", () => {
    expect(
      buildPendingApprovalLine({ entity: "invoice", id: "INV-002", amount: 0 }),
    ).toBe("Invoice 002 is pending approval");
  });
});
