import { describe, expect, it } from "vitest";
import { deriveProgressCounts } from "./useAiRedlineSuggestions";

describe("deriveProgressCounts", () => {
  it("surfaces per-side CM/PM accepts and the both-accepted total", () => {
    expect(
      deriveProgressCounts({ cm_accept: 3, pm_accept: 1, resolvedCount: 1 }),
    ).toEqual({ cmAddressed: 3, pmAddressed: 1, resolved: 1 });
  });

  it("falls back to `resolved` when `resolvedCount` is absent", () => {
    expect(deriveProgressCounts({ cm_accept: 2, pm_accept: 2, resolved: 2 })).toEqual(
      { cmAddressed: 2, pmAddressed: 2, resolved: 2 },
    );
  });

  it("prefers `resolvedCount` over `resolved` when both are present", () => {
    expect(
      deriveProgressCounts({ resolvedCount: 5, resolved: 9 }).resolved,
    ).toBe(5);
  });

  it("leaves counts undefined when the BE omits them", () => {
    expect(deriveProgressCounts({})).toEqual({
      cmAddressed: undefined,
      pmAddressed: undefined,
      resolved: undefined,
    });
    expect(deriveProgressCounts(undefined)).toEqual({
      cmAddressed: undefined,
      pmAddressed: undefined,
      resolved: undefined,
    });
  });

  it("keeps a zero count distinct from an omitted one", () => {
    expect(deriveProgressCounts({ cm_accept: 0, pm_accept: 0 })).toEqual({
      cmAddressed: 0,
      pmAddressed: 0,
      resolved: undefined,
    });
  });
});
