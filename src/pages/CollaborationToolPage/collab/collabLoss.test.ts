import { describe, expect, it } from "vitest";
import { classifyCollabLoss, COLLAB_LOSS_MESSAGE } from "./collabLoss";

describe("classifyCollabLoss", () => {
  it("a 401 from the authenticated probe means the session expired", () => {
    expect(classifyCollabLoss("retries-exhausted", 401)).toBe("session-expired");
    expect(classifyCollabLoss("initial-sync-failed", 401)).toBe("session-expired");
    expect(COLLAB_LOSS_MESSAGE["session-expired"]).toMatch(/session expired.*sign in/i);
  });

  it("another tab taking over is reported as such, whatever the probe says", () => {
    expect(classifyCollabLoss("replaced", 401)).toBe("replaced");
  });

  it("anything else is a plain disconnect", () => {
    expect(classifyCollabLoss("retries-exhausted", 200)).toBe("disconnected");
    expect(classifyCollabLoss("retries-exhausted", undefined)).toBe("disconnected");
  });
});
