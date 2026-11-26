import { describe, expect, it } from "vitest";
import { mergeRegenerated } from "./redlineItems";
import type { RedlineSpan } from "./redlineScan";

// O6: the PM clicks Generate suggestions after case 1 was applied.
const applied = {
  redline: {
    redlineId: "case1",
    kind: "insertion" as const,
    text: "Hybrid",
    deletedText: "Remote",
    insertedText: "Hybrid",
  },
  suggestion: { redlineId: "case1", tag: "old" },
  state: "approved" as const,
  accepted: { status: "both" },
};
const pending = {
  redline: { redlineId: "case2", kind: "deletion" as const, text: "net 60" },
  suggestion: { redlineId: "case2", tag: "old" },
  state: "pending" as const,
  accepted: { status: "cm" },
};
// Case 1 is no longer a tracked change; case 2 still is.
const live: RedlineSpan[] = [{ redlineId: "case2", kind: "deletion", text: "net 60" }];
const fresh = new Map([["case2", { redlineId: "case2", tag: "new" }]]);

describe("mergeRegenerated (O6)", () => {
  it("keeps an applied replacement card as Remote -> Hybrid, still resolved", () => {
    const next = mergeRegenerated([applied, pending], live, fresh);
    const card = next.find((i) => i.redline.redlineId === "case1");
    expect(card).toEqual(applied);
  });

  it("keeps each card's approval state, so counters do not drop to 0", () => {
    const next = mergeRegenerated([applied, pending], live, fresh);
    const card = next.find((i) => i.redline.redlineId === "case2");
    expect(card?.state).toBe("pending");
    expect(card?.accepted).toEqual({ status: "cm" });
    expect(card?.suggestion).toEqual({ redlineId: "case2", tag: "new" });
  });

  it("adds a new tracked change as a pending card", () => {
    const next = mergeRegenerated(
      [],
      [{ redlineId: "case3", kind: "insertion", text: "Onsite" }],
      new Map([["case3", { redlineId: "case3", tag: "new" }]]),
    );
    expect(next).toEqual([
      {
        redline: { redlineId: "case3", kind: "insertion", text: "Onsite" },
        suggestion: { redlineId: "case3", tag: "new" },
        state: "pending",
      },
    ]);
  });
});
