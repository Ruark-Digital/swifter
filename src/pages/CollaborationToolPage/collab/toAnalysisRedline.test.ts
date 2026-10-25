import { describe, expect, it } from "vitest";
import { toAnalysisRedline } from "./useAiRedlineSuggestions";

// QA #186: a replacement's struck text is the original and its inserted text
// the redline. The BE request has no `originalText`, so the pair is folded into
// `text` instead of sending the insertion alone as if it were the original.
describe("toAnalysisRedline", () => {
  it("folds a replacement's original and redline into the request text", () => {
    expect(
      toAnalysisRedline({
        redlineId: "r1",
        kind: "insertion",
        text: "45 days",
        originalText: "15 days",
        documentPosition: 3,
      }),
    ).toEqual({
      redlineId: "r1",
      kind: "insertion",
      text: 'Replace "15 days" with "45 days"',
      documentPosition: 3,
    });
  });

  it("never sends originalText (the BE request schema is strict)", () => {
    expect(
      toAnalysisRedline({ redlineId: "r1", kind: "insertion", text: "b", originalText: "a" }),
    ).not.toHaveProperty("originalText");
  });

  it("leaves a plain insertion or deletion unchanged", () => {
    const ins = { redlineId: "r2", kind: "insertion" as const, text: "new" };
    const del = { redlineId: "r3", kind: "deletion" as const, text: "old" };
    expect(toAnalysisRedline(ins)).toEqual(ins);
    expect(toAnalysisRedline(del)).toEqual(del);
  });
});
