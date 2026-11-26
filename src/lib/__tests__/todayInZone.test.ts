import { describe, it, expect } from "vitest";
import { todayInZone } from "../todayInZone";

describe("todayInZone", () => {
  // 2026-06-10T23:30Z is already June 11 in Lagos (+1) but still June 10 in Los Angeles
  const now = new Date("2026-06-10T23:30:00Z");
  it("uses the selected timezone's calendar day", () => {
    const lagos = todayInZone("Africa/Lagos", now);
    expect([lagos.getFullYear(), lagos.getMonth(), lagos.getDate()]).toEqual([2026, 5, 11]);
    const la = todayInZone("America/Los_Angeles", now);
    expect([la.getFullYear(), la.getMonth(), la.getDate()]).toEqual([2026, 5, 10]);
  });
  it("falls back to the browser day when tz is missing", () => {
    expect(todayInZone(undefined, now).getHours()).toBe(0);
  });
});
