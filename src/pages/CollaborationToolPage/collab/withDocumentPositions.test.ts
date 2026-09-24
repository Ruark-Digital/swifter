import { describe, expect, it } from "vitest";
import { withDocumentPositions } from "./useAiRedlineSuggestions";

describe("withDocumentPositions", () => {
  it("keeps a real documentPosition supplied by the editor", () => {
    const out = withDocumentPositions([
      { redlineId: "a", kind: "insertion", text: "x", documentPosition: 42 },
    ]);
    expect(out[0].documentPosition).toBe(42);
  });

  it("falls back to the span's index (document order) when absent", () => {
    const out = withDocumentPositions([
      { redlineId: "a", kind: "insertion", text: "x" },
      { redlineId: "b", kind: "deletion", text: "y" },
    ]);
    expect(out.map((r) => r.documentPosition)).toEqual([0, 1]);
  });

  it("keeps a documentPosition of 0 instead of replacing it", () => {
    const out = withDocumentPositions([
      { redlineId: "b", kind: "deletion", text: "y" },
      { redlineId: "a", kind: "insertion", text: "x", documentPosition: 0 },
    ]);
    expect(out.map((r) => r.documentPosition)).toEqual([0, 0]);
  });
});
