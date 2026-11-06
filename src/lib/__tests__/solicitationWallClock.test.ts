import { describe, it, expect } from "vitest";
import { buildEventDate, formatDateTZ, toWallClockPayload } from "../utils";

// Solicitation datetimes are stored as UTC instants. Forms send the wall clock
// in the solicitation's zone without an offset; the BE converts it back. These
// assertions hold in any machine timezone.
describe("solicitation edit round trip", () => {
  const stored = "2026-09-24T21:00:00.000Z"; // 5 PM EDT

  it("prefills the wall clock in the solicitation zone", () => {
    expect(formatDateTZ(stored, "yyyy-MM-dd'T'HH:mm:ss", "EST")).toBe(
      "2026-09-24T17:00:00"
    );
  });

  it("sends an untouched prefill back as the same zone wall clock", () => {
    const prefill = formatDateTZ(stored, "yyyy-MM-dd'T'HH:mm:ss", "EST");
    expect(toWallClockPayload(prefill)).toBe("2026-09-24T17:00:00");
  });

  it("sends a picked local Date as its wall clock", () => {
    expect(toWallClockPayload(new Date(2026, 10, 6, 14, 0))).toBe(
      "2026-11-06T14:00:00"
    );
  });
});

describe("buildEventDate", () => {
  it("accepts an unchanged prefilled datetime string (was 'Invalid time value')", () => {
    const prefill = formatDateTZ(
      "2026-10-07T14:00:00.000Z",
      "yyyy-MM-dd'T'HH:mm:ss",
      "MST"
    );
    const time = formatDateTZ("2026-10-07T14:00:00.000Z", "HH:mm", "MST");
    expect(buildEventDate(prefill, time)).toBe("2026-10-07T08:00:00");
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
