import { describe, it, expect } from "vitest";
import { format } from "date-fns";
import { formatWallClockWithZone } from "../utils";

const FMT = "MMMM dd, yyyy hh:mm a";

// Stored solicitation datetimes are UTC instants. With a zone, the output is the
// wall clock in that zone, so these assertions hold in any machine timezone.
describe("formatWallClockWithZone — instant shown in the solicitation zone", () => {
  it("converts a summer instant into the zone's daylight time", () => {
    // 21:00Z on Sep 24 is 5 PM EDT (UTC-4).
    expect(
      formatWallClockWithZone("2026-09-24T21:00:00.000Z", FMT, "EST")
    ).toBe("September 24, 2026 05:00 PM EST");
  });

  it("converts a winter instant into the zone's standard time", () => {
    // 23:00Z on Nov 20 is 6 PM EST (UTC-5).
    expect(
      formatWallClockWithZone("2026-11-20T23:00:00.000Z", FMT, "EST")
    ).toBe("November 20, 2026 06:00 PM EST");
  });

  it("treats a naive datetime (no Z/offset) as UTC", () => {
    expect(formatWallClockWithZone("2026-11-18T00:00:00", FMT, "EST")).toBe(
      "November 17, 2026 07:00 PM EST"
    );
  });

  it("renders a date-only string without a time shift", () => {
    expect(formatWallClockWithZone("2026-10-09", "MMMM dd, yyyy", "EST")).toBe(
      "October 09, 2026 EST"
    );
  });

  it("uses the viewer's zone and no label when no zone is supplied", () => {
    const iso = "2026-10-05T13:00:00.000Z";
    expect(formatWallClockWithZone(iso, FMT)).toBe(format(new Date(iso), FMT));
  });

  it("returns N/A for missing input", () => {
    expect(formatWallClockWithZone(undefined, FMT, "EST")).toBe("N/A");
    expect(formatWallClockWithZone(null, FMT, "EST")).toBe("N/A");
  });
});
