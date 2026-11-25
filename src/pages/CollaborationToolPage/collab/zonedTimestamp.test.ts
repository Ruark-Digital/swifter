import { describe, expect, it } from "vitest";
import { formatZonedTimestamp } from "./zonedTimestamp";

describe("formatZonedTimestamp", () => {
  const iso = "2026-11-25T19:39:00.000Z";

  it("renders in the contract timezone and names it", () => {
    expect(formatZonedTimestamp(iso, "Pacific/Auckland")).toMatch(
      /^Nov 26, 2026, 8:39 AM GMT\+13$/,
    );
    expect(formatZonedTimestamp(iso, "America/New_York")).toMatch(/2:39 PM (EST|GMT-5)$/);
  });

  it("accepts the abbreviation the app stores", () => {
    expect(formatZonedTimestamp(iso, "NZST")).toMatch(/Nov 26, 2026, 8:39 AM/);
  });

  it("shows docx wall-clock comments as-is, labelled UTC", () => {
    expect(formatZonedTimestamp(iso, "Pacific/Auckland", { wallClock: true })).toMatch(
      /7:39 PM UTC$/,
    );
  });

  it("is empty for missing or invalid input", () => {
    expect(formatZonedTimestamp(undefined, "UTC")).toBe("");
    expect(formatZonedTimestamp("nope", "UTC")).toBe("");
  });
});
