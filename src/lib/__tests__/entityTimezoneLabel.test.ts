import { describe, expect, it } from "vitest";
import { formatDateInZoneAbbrev, formatWallClockWithZone } from "@/lib/utils";

const FMT = "MMM d, yyyy h:mm a";

describe("formatWallClockWithZone (entity timezone, labelled)", () => {
  it("renders the entity zone wall clock, not the browser's, with the label", () => {
    expect(formatWallClockWithZone("2026-11-25T10:33:00.000Z", FMT, "PST")).toBe(
      "Nov 25, 2026 2:33 AM PST"
    );
  });

  it("labels with the zone's name at that instant (NZDT in November, NZST in July)", () => {
    expect(formatWallClockWithZone("2026-11-25T10:33:00.000Z", FMT, "NZST")).toBe(
      "Nov 25, 2026 11:33 PM NZDT"
    );
    expect(formatWallClockWithZone("2026-07-25T10:33:00.000Z", FMT, "NZST")).toBe(
      "Jul 25, 2026 10:33 PM NZST"
    );
  });

  it("uses a valid 12-hour clock at midnight (never 00:xx AM)", () => {
    expect(formatWallClockWithZone("2026-11-30T00:00:00.000Z", FMT, "UTC")).toBe(
      "Nov 30, 2026 12:00 AM UTC"
    );
  });

  it("accepts an IANA zone name", () => {
    expect(
      formatWallClockWithZone("2026-11-25T10:33:00.000Z", FMT, "Pacific/Auckland")
    ).toBe("Nov 25, 2026 11:33 PM NZDT");
  });

  it("matches formatDateInZoneAbbrev for abbreviations", () => {
    expect(formatWallClockWithZone("2026-08-12T09:49:32Z", FMT, "EST")).toBe(
      formatDateInZoneAbbrev("2026-08-12T09:49:32Z", FMT, "EST")
    );
  });

  it("returns N/A for empty input and no label when there is no zone", () => {
    expect(formatWallClockWithZone(undefined, FMT, "EST")).toBe("N/A");
    expect(formatWallClockWithZone("2026-11-25", "MMM d, yyyy", "EST")).toBe(
      "Nov 25, 2026 EST"
    );
  });
});
