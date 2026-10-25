import { describe, expect, it } from "vitest";
import { canResubmitLem } from "../lemStatus";

// QA #174: the vendor PM saw an "Edit" button on a submitted LEM still under
// approval. Only a rejected LEM may be changed (Resubmit).
describe("canResubmitLem (LEM detail footer gating)", () => {
  it.each(["pending", "approved", "Pending", "APPROVED"])(
    "hides the footer action for %s LEMs",
    (status) => {
      expect(canResubmitLem(status)).toBe(false);
    },
  );

  it.each(["rejected", "Rejected", " REJECTED "])(
    "keeps Resubmit for %s LEMs",
    (status) => {
      expect(canResubmitLem(status)).toBe(true);
    },
  );

  it("hides the footer action when status is missing", () => {
    expect(canResubmitLem(undefined)).toBe(false);
    expect(canResubmitLem(null)).toBe(false);
    expect(canResubmitLem("")).toBe(false);
  });
});
