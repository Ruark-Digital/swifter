import { describe, expect, it } from "vitest";
import { buildPendingApprovalLine, titleCaseName } from "../lib/contractAlerts";

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

  it("capitalizes a lower-cased name from the payload (QA #9)", () => {
    expect(
      buildPendingApprovalLine({
        entity: "ncr",
        id: "NCR-003",
        pendingWith: "eric mobley",
        pendingWithRole: "project_manager",
      }),
    ).toBe("NCR 003 is pending Eric Mobley's approval");
  });

  it("keeps the legacy role phrasing when only pendingWith is set", () => {
    // Use a non-directive entity: a change directive awaits the vendor's
    // response (handled by its own branch), so it would never exercise the
    // legacy "pending {role} approval" path this case is asserting.
    expect(
      buildPendingApprovalLine({
        entity: "invoice",
        id: "INV-003",
        pendingWith: "approver",
      }),
    ).toBe("Invoice 003 is pending approver approval");
  });

  it("falls back to a generic line without a responsible party", () => {
    expect(
      buildPendingApprovalLine({ entity: "invoice", id: "INV-002", amount: 0 }),
    ).toBe("Invoice 002 is pending approval");
  });
});

describe("titleCaseName (QA #9)", () => {
  it("capitalizes each name part", () => {
    expect(titleCaseName("eric mobley")).toBe("Eric Mobley");
  });

  it("is idempotent for already-capitalized names and collapses spaces", () => {
    expect(titleCaseName("Man Wonder  Ap1")).toBe("Man Wonder Ap1");
  });

  it("preserves intentional inner casing and handles hyphens", () => {
    expect(titleCaseName("mary-jane mcdonald")).toBe("Mary-Jane Mcdonald");
    expect(titleCaseName("McDonald")).toBe("McDonald");
  });

  it("returns empty string for empty/undefined input", () => {
    expect(titleCaseName("")).toBe("");
    expect(titleCaseName(undefined)).toBe("");
  });
});
