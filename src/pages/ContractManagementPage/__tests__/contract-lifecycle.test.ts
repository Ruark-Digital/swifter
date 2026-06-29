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
});
