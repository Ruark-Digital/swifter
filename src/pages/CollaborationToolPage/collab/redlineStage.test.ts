import { describe, it, expect } from "vitest";
import {
  getRedlineResolvedHolder,
  redlineStageLabel,
} from "./useAiRedlineSuggestions";

describe("redline resolution stage (#87)", () => {
  it("reads the holder from the object shape", () => {
    expect(getRedlineResolvedHolder({ resolvedBy: { holder: "vendor" } })).toBe(
      "vendor",
    );
    expect(getRedlineResolvedHolder({ resolvedBy: { holder: "manager" } })).toBe(
      "manager",
    );
  });

  it("tolerates the legacy bare-string shape", () => {
    expect(getRedlineResolvedHolder({ resolvedBy: "vendor" })).toBe("vendor");
    expect(getRedlineResolvedHolder({ resolvedBy: "manager" })).toBe("manager");
    // Unknown string → undefined (caller treats as Addressed)
    expect(getRedlineResolvedHolder({ resolvedBy: "someUserId" })).toBeUndefined();
  });

  it("returns undefined when no resolver info is present", () => {
    expect(getRedlineResolvedHolder(undefined)).toBeUndefined();
    expect(getRedlineResolvedHolder({})).toBeUndefined();
    expect(getRedlineResolvedHolder({ resolvedBy: {} })).toBeUndefined();
  });

  it("labels 'Resolved' only for a vendor-side resolution", () => {
    expect(redlineStageLabel("vendor")).toBe("Resolved");
    // Manager-side or unknown → Addressed (awaiting the vendor)
    expect(redlineStageLabel("manager")).toBe("Addressed");
    expect(redlineStageLabel(undefined)).toBe("Addressed");
  });
});
