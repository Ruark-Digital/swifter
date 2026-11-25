import { describe, expect, it } from "vitest";
import { formatMaxUsers } from "@/lib/utils";

describe("formatMaxUsers", () => {
  it("shows Unlimited for the unlimited sentinels", () => {
    expect(formatMaxUsers(Number.MAX_SAFE_INTEGER)).toBe("Unlimited");
    expect(formatMaxUsers(-1)).toBe("Unlimited");
  });
  it("passes real limits through", () => {
    expect(formatMaxUsers(25)).toBe(25);
  });
});
