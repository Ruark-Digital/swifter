import { describe, expect, test } from "vitest";
import { getEffectiveClaimStatus } from "../claimStatus";

describe("getEffectiveClaimStatus", () => {
  test("rejected manager decision on an under-review claim reads as rejected", () => {
    expect(
      getEffectiveClaimStatus({
        status: "under review",
        manager: { status: "rejected" },
      }),
    ).toBe("rejected");
  });

  test("rejected approver decision on an under-review claim reads as rejected", () => {
    expect(
      getEffectiveClaimStatus({
        status: "under review",
        approvers: [{ level: 1, user: [{ user: "u1", status: "rejected" }] }],
      }),
    ).toBe("rejected");
    expect(
      getEffectiveClaimStatus({
        status: "under review",
        approvers: [{ level: 1, levelStatus: "rejected" }],
      }),
    ).toBe("rejected");
  });

  test("under-review claim with no rejection stays under review", () => {
    expect(
      getEffectiveClaimStatus({
        status: "under review",
        manager: { status: "approved" },
        approvers: [{ level: 1, user: [{ user: "u1", status: "pending" }] }],
      }),
    ).toBe("under review");
  });

  test("final top-level statuses are passed through unchanged", () => {
    expect(
      getEffectiveClaimStatus({ status: "approved", manager: { status: "rejected" } }),
    ).toBe("approved");
    expect(getEffectiveClaimStatus({ status: "dispute" })).toBe("dispute");
    expect(getEffectiveClaimStatus(undefined)).toBe("");
  });
});
