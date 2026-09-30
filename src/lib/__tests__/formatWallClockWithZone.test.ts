import { describe, it, expect } from "vitest";
import { formatWallClockWithZone } from "../utils";

const FMT = "MMMM dd, yyyy hh:mm a";

// These assertions are independent of the machine's local timezone: the helper
// echoes the stored wall-clock digits from UTC fields, so the output is
// deterministic regardless of where the test runs.
describe("formatWallClockWithZone — echo wall clock + zone label", () => {
  it("renders a UTC-stamped instant as the wall clock it was entered in", () => {
    // 1 PM EST was stored as 13:00 stamped UTC; it must read back as 1 PM,
    // not shift into the viewer's zone.
    const out = formatWallClockWithZone(
      "2026-10-05T13:00:00.000Z",
      FMT,
      "EST"
    );
    expect(out).toBe("October 05, 2026 01:00 PM EST");
  });

  it("formats 12 o'clock as 12 (not 00) with the hh token", () => {
    const out = formatWallClockWithZone(
      "2026-09-30T12:25:53.879Z",
      FMT,
      "EST"
    );
    expect(out).toBe("September 30, 2026 12:25 PM EST");
  });

  it("treats a naive datetime (no Z/offset) as the same wall clock", () => {
    const out = formatWallClockWithZone(
      "2026-11-18T00:00:00",
      FMT,
      "EST"
    );
    expect(out).toBe("November 18, 2026 12:00 AM EST");
  });

  it("renders a date-only string without a time shift", () => {
    const out = formatWallClockWithZone("2026-10-09", "MMMM dd, yyyy", "EST");
    expect(out).toBe("October 09, 2026 EST");
  });

  it("omits the label when no zone is supplied", () => {
    const out = formatWallClockWithZone("2026-10-05T13:00:00.000Z", FMT);
    expect(out).toBe("October 05, 2026 01:00 PM");
  });

  it("returns N/A for missing input", () => {
    expect(formatWallClockWithZone(undefined, FMT, "EST")).toBe("N/A");
    expect(formatWallClockWithZone(null, FMT, "EST")).toBe("N/A");
  });
});
