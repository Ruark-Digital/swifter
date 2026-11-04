import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { formatDateInZoneAbbrev, formatDateTZ } from "../utils";

const FMT = "MMM d, yyyy h:mm a";

// These assertions are independent of the machine's local timezone: zone-aware
// output is rebuilt from UTC fields, and the no-zone assertions compare against
// date-fns running on the same machine.
describe("formatDateTZ — honors the zone argument", () => {
  it("renders a September EST deadline in EDT (1 PM, not 5 PM)", () => {
    // 17:00Z = 13:00 EDT (UTC-4) in September.
    expect(formatDateTZ("2026-09-24T17:00:00Z", FMT, "EST")).toBe(
      "Sep 24, 2026 1:00 PM"
    );
  });

  it("renders a January EST deadline in EST (standard)", () => {
    // 17:00Z = 12:00 EST (UTC-5) in January.
    expect(formatDateTZ("2026-01-15T17:00:00Z", FMT, "EST")).toBe(
      "Jan 15, 2026 12:00 PM"
    );
  });

  it("treats a naive datetime as UTC when a zone is given", () => {
    expect(formatDateTZ("2026-09-24T17:00:00", FMT, "EST")).toBe(
      formatDateTZ("2026-09-24T17:00:00Z", FMT, "EST")
    );
  });

  it("uses a fixed offset for non-DST abbreviations", () => {
    // 05:23Z in WAT (UTC+1, no DST) = 06:23.
    expect(formatDateTZ("2026-07-27T05:23:00.000Z", FMT, "WAT")).toBe(
      "Jul 27, 2026 6:23 AM"
    );
  });

  it("keeps calendar dates on their own day in any zone", () => {
    expect(formatDateTZ("2026-09-03", "MMM d, yyyy", "EST")).toBe(
      "Sep 3, 2026"
    );
  });

  it("falls back to the viewer's zone for an unrecognized abbreviation", () => {
    const iso = "2026-09-24T17:00:00Z";
    expect(formatDateTZ(iso, FMT, "NOT_A_ZONE")).toBe(
      format(new Date(iso), FMT)
    );
  });

  it("uses the viewer's zone when no zone is passed", () => {
    const iso = "2026-09-24T17:00:00Z";
    expect(formatDateTZ(iso, FMT)).toBe(format(new Date(iso), FMT));
  });

  it("returns N/A for empty input", () => {
    expect(formatDateTZ(null, FMT, "EST")).toBe("N/A");
  });
});

describe("formatDateInZoneAbbrev — calendar dates", () => {
  it("does not roll a date-only value back a day in a west-of-UTC zone", () => {
    expect(formatDateInZoneAbbrev("2026-09-03", "MMM d, yyyy", "EST")).toBe(
      "Sep 3, 2026"
    );
  });
});
