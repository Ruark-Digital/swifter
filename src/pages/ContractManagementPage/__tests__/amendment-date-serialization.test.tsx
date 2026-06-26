import { describe, it, expect } from "vitest";
import {
  toAmendmentDateValue,
  toAmendmentDateTimeValue,
} from "../utils/amendmentDate";

describe("toAmendmentDateValue", () => {
  it("serializes a Date to its local calendar date (no timezone off-by-one)", () => {
    // A user picks Aug 13, 2026 in the date picker -> local midnight Date.
    // The old `.toISOString()` path shifted this to Aug 12 for users east of
    // UTC (e.g. WAT/UTC+1), because local midnight is the previous day in UTC.
    const picked = new Date(2026, 7, 13, 0, 0, 0);
    expect(toAmendmentDateValue(picked)).toBe("2026-08-13");
  });

  it("passes a date-only string through unchanged", () => {
    expect(toAmendmentDateValue("2026-05-20")).toBe("2026-05-20");
  });
});

describe("toAmendmentDateTimeValue", () => {
  it("serializes a Date to local date+time (preserves the picked calendar day)", () => {
    const picked = new Date(2026, 7, 13, 9, 30, 0);
    expect(toAmendmentDateTimeValue(picked)).toBe("2026-08-13 09:30:00");
  });

  it("passes a string through unchanged", () => {
    expect(toAmendmentDateTimeValue("2026-05-20 14:00:00")).toBe(
      "2026-05-20 14:00:00",
    );
  });
});
