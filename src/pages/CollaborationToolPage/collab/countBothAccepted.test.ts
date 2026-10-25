import { describe, expect, it } from "vitest";
import { countBothAccepted } from "./useAiRedlineSuggestions";

// QA #185: "resolved" counts only redlines both sides accepted — not items
// one side addressed that still await the other side.
describe("countBothAccepted", () => {
  it("does not count one-sided acceptances awaiting the other side", () => {
    expect(
      countBothAccepted([
        { status: "cm_accepted", cmAccepted: true },
        { status: "vendor_accepted", vendorAccepted: true },
        { status: "pending" },
        undefined,
      ]),
    ).toBe(0);
  });

  it("counts both-accepted redlines by status or by both flags", () => {
    expect(
      countBothAccepted([
        { status: "both_accepted" },
        { cmAccepted: true, vendorAccepted: true },
        { status: "cm_accepted", cmAccepted: true },
      ]),
    ).toBe(2);
  });
});
