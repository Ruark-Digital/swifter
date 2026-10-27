import { describe, expect, test } from "vitest";
import { availableLifecycleActions } from "../components/contractLifecycle";

describe("availableLifecycleActions", () => {
  test("treats Published like publish for lifecycle actions", () => {
    expect(availableLifecycleActions("Published")).toEqual(
      expect.arrayContaining(["suspend", "terminate", "complete"]),
    );
  });

  test("keeps publish status lifecycle actions enabled", () => {
    expect(availableLifecycleActions("publish")).toEqual(
      expect.arrayContaining(["suspend", "terminate", "complete"]),
    );
  });

  test("offers un-suspend for a suspended contract (QA #237)", () => {
    expect(availableLifecycleActions("suspended")).toEqual(["unsuspend"]);
  });

  test("does not offer un-suspend for active/publish contracts", () => {
    expect(availableLifecycleActions("active")).not.toContain("unsuspend");
    expect(availableLifecycleActions("publish")).not.toContain("unsuspend");
  });
});
