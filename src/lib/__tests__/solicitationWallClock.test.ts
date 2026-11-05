import { describe, it, expect } from "vitest";
import {
  buildEventDate,
  formatWallClockWithZone,
  toWallClockPayload,
} from "../utils";

// Solicitation datetimes are stored as the entered wall clock stamped UTC, so
// 21:00Z on an EST solicitation means 9 PM EST. These assertions hold in any
// machine timezone.
describe("solicitation wall-clock round trip", () => {
  const stored = "2026-09-24T21:00:00.000Z";

  it("renders the stored digits, not a zone-converted time", () => {
    expect(formatWallClockWithZone(stored, "MMM d, yyyy, h:mm a")).toBe(
      "Sep 24, 2026, 9:00 PM"
    );
  });

  it("saves an untouched edit prefill back to the same wall clock", () => {
    const prefill = formatWallClockWithZone(stored, "yyyy-MM-dd'T'HH:mm:ss");
    expect(toWallClockPayload(prefill)).toBe("2026-09-24T21:00:00");
  });

  it("saves a picked local Date as its wall clock", () => {
    expect(toWallClockPayload(new Date(2026, 10, 6, 14, 0))).toBe(
      "2026-11-06T14:00:00"
    );
  });
});

describe("buildEventDate", () => {
  it("accepts an unchanged prefilled datetime string (was 'Invalid time value')", () => {
    const prefill = formatWallClockWithZone(
      "2026-10-05T13:00:00.000Z",
      "yyyy-MM-dd'T'HH:mm:ss"
    );
    expect(buildEventDate(prefill, "13:00")).toBe("2026-10-05T13:00:00");
  });

  it("uses the local calendar day of a picked Date", () => {
    expect(buildEventDate(new Date(2026, 9, 5), "09:30")).toBe(
      "2026-10-05T09:30:00"
    );
  });

  it("returns undefined for missing or invalid parts", () => {
    expect(buildEventDate(undefined, "09:30")).toBeUndefined();
    expect(buildEventDate("2026-10-05", "")).toBeUndefined();
    expect(buildEventDate("not a date", "09:30")).toBeUndefined();
    expect(buildEventDate("2026-10-05", "99:99")).toBeUndefined();
  });
});
