import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { daysUntilCalendar } from "@/lib/utils";

// QA #120/#30/#39 — the countdown must count calendar days, not full 24h
// periods. differenceInDays truncated the partial day, so a deadline two
// calendar days out (but < 48h away) read as "1 day left" instead of "2".
describe("daysUntilCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // "Now" = 28 Sep 2026, 14:00 local.
    vi.setSystemTime(new Date(2026, 8, 28, 14, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts calendar days, not truncated 24h periods (the #120 case)", () => {
    // Due on the 30th at midnight is ~34h away — differenceInDays would give 1.
    expect(daysUntilCalendar(new Date(2026, 8, 30, 0, 0, 0))).toBe(2);
  });

  it("returns 0 for a deadline later the same day", () => {
    expect(daysUntilCalendar(new Date(2026, 8, 28, 23, 0, 0))).toBe(0);
  });

  it("returns a negative count once the date has passed (overdue)", () => {
    expect(daysUntilCalendar(new Date(2026, 8, 26, 9, 0, 0))).toBe(-2);
  });

  it("accepts ISO strings", () => {
    expect(daysUntilCalendar("2026-09-30")).toBe(2);
  });

  it("returns null for empty or invalid input", () => {
    expect(daysUntilCalendar(undefined)).toBeNull();
    expect(daysUntilCalendar("")).toBeNull();
    expect(daysUntilCalendar("not-a-date")).toBeNull();
  });
});
