import { describe, expect, it } from "vitest";
import {
  formatDateInZoneAbbrev,
  formatWallClockWithZone,
  zoneLabelAt,
} from "@/lib/utils";

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

describe("zoneLabelAt (Timezone column agrees with the dates)", () => {
  it("gives the same seasonal label formatWallClockWithZone appends", () => {
    const nov = "2026-11-25T10:33:00.000Z";
    expect(zoneLabelAt("NZST", nov)).toBe("NZDT");
    expect(formatWallClockWithZone(nov, FMT, "NZST").endsWith(" NZDT")).toBe(true);
    expect(zoneLabelAt("NZST", "2026-07-25T10:33:00.000Z")).toBe("NZST");
  });

  it("returns unknown zones as stored and empty for none", () => {
    expect(zoneLabelAt("XYZ", "2026-11-25T10:33:00.000Z")).toBe("XYZ");
    expect(zoneLabelAt(undefined)).toBe("");
  });
});

describe("evaluation list row (N5): Timezone column matches the deadline label", () => {
  // Mirrors transformEvaluationData / transformAssignedEvaluationData in
  // EvaluationManagementPage: deadline via formatWallClockWithZone, Timezone
  // column via zoneLabelAt, both at the evaluation endDate.
  const row = (endDate: string, timezone: string) => ({
    deadline: formatWallClockWithZone(endDate, "MMM d, yyyy h:mm a", timezone),
    timezone: zoneLabelAt(timezone, endDate),
  });

  it("shows NZDT in both the deadline and the Timezone column in November", () => {
    const r = row("2026-11-30T10:00:00.000Z", "NZST");
    expect(r.deadline).toBe("Nov 30, 2026 11:00 PM NZDT");
    expect(r.timezone).toBe("NZDT");
  });

  it("agrees for every DST-observing zone in both seasons", () => {
    for (const tz of ["NZST", "AEST", "ACST", "EST", "CST", "MST", "PST", "CET", "EET", "BST"]) {
      for (const at of ["2026-01-15T12:00:00.000Z", "2026-07-15T12:00:00.000Z"]) {
        const r = row(at, tz);
        expect(r.deadline.endsWith(" " + r.timezone), tz + " @ " + at).toBe(true);
      }
    }
  });
});
