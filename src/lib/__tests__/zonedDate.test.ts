import { describe, it, expect } from "vitest";
import {
  formatInTz,
  isLegacyUtcMidnight,
  resolveTimeZone,
  toCalendarDate,
  toZonedStartOfDayISO,
} from "../zonedDate";

// A Date the way a date picker yields it: local midnight of the picked day.
const picked = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe("resolveTimeZone", () => {
  it("accepts IANA names, abbreviations (DST-aware) and rejects junk", () => {
    expect(resolveTimeZone("America/Toronto")).toBe("America/Toronto");
    expect(resolveTimeZone("EST")).toBe("America/New_York");
    expect(resolveTimeZone("IST")).toBe("+05:30");
    expect(resolveTimeZone("UTC")).toBe("UTC");
    expect(resolveTimeZone("Not/AZone")).toBeUndefined();
    expect(resolveTimeZone("")).toBeUndefined();
    expect(resolveTimeZone(null)).toBeUndefined();
  });
});

describe("toZonedStartOfDayISO", () => {
  const cases: [string, string, string][] = [
    ["UTC", "2027-01-25", "2027-01-25T00:00:00.000+00:00"],
    ["America/Toronto", "2027-01-25", "2027-01-25T00:00:00.000-05:00"],
    ["America/Toronto", "2027-07-25", "2027-07-25T00:00:00.000-04:00"],
    // DST starts 2027-03-14 at 02:00 and ends 2027-11-07 at 02:00; midnight is
    // before the switch on both days, so the offsets differ either side.
    ["America/Toronto", "2027-03-13", "2027-03-13T00:00:00.000-05:00"],
    ["America/Toronto", "2027-03-14", "2027-03-14T00:00:00.000-05:00"],
    ["America/Toronto", "2027-03-15", "2027-03-15T00:00:00.000-04:00"],
    ["America/Toronto", "2027-11-06", "2027-11-06T00:00:00.000-04:00"],
    ["America/Toronto", "2027-11-07", "2027-11-07T00:00:00.000-04:00"],
    ["America/Toronto", "2027-11-08", "2027-11-08T00:00:00.000-05:00"],
    ["Pacific/Pago_Pago", "2027-01-25", "2027-01-25T00:00:00.000-11:00"],
    ["Pacific/Kiritimati", "2027-01-25", "2027-01-25T00:00:00.000+14:00"],
    ["Asia/Kolkata", "2027-01-25", "2027-01-25T00:00:00.000+05:30"],
    // Stored abbreviations resolve DST-correctly too.
    ["EST", "2027-07-25", "2027-07-25T00:00:00.000-04:00"],
    ["IST", "2027-01-25", "2027-01-25T00:00:00.000+05:30"],
  ];
  it.each(cases)("%s %s -> %s", (tz, ymd, expected) => {
    expect(toZonedStartOfDayISO(ymd, tz)).toBe(expected);
    // The same calendar day from a picker Date gives the same result.
    const [y, m, d] = ymd.split("-").map(Number);
    expect(toZonedStartOfDayISO(picked(y, m, d), tz)).toBe(expected);
  });

  it("returns undefined for empty or invalid input", () => {
    expect(toZonedStartOfDayISO(undefined, "UTC")).toBeUndefined();
    expect(toZonedStartOfDayISO("", "UTC")).toBeUndefined();
    expect(toZonedStartOfDayISO(new Date("x"), "UTC")).toBeUndefined();
  });

  it("never equals the legacy 00:00:00.000Z shape unless the zone is UTC", () => {
    const iso = toZonedStartOfDayISO("2027-01-25", "Pacific/Pago_Pago")!;
    expect(new Date(iso).toISOString()).toBe("2027-01-25T11:00:00.000Z");
  });
});

describe("legacy UTC-midnight rule", () => {
  it("detects exactly 00:00:00.000Z only", () => {
    expect(isLegacyUtcMidnight("2027-01-20T00:00:00.000Z")).toBe(true);
    expect(isLegacyUtcMidnight("2027-01-20T00:00:00Z")).toBe(true);
    expect(isLegacyUtcMidnight("2027-01-20T11:00:00.000Z")).toBe(false);
    expect(isLegacyUtcMidnight("2027-01-20T00:00:01.000Z")).toBe(false);
  });

  it.each(["UTC", "America/Toronto", "Pacific/Pago_Pago", "Pacific/Kiritimati", "Asia/Kolkata"])(
    "shows the UTC calendar date in %s (no shift)",
    (tz) => {
      expect(formatInTz("2027-01-20T00:00:00.000Z", tz, "dd MMM yyyy")).toBe("20 Jan 2027");
      expect(toCalendarDate("2027-01-20T00:00:00.000Z", tz)).toEqual(new Date(2027, 0, 20));
    }
  );
});

describe("formatInTz", () => {
  it("formats a real instant in the given zone, not the browser's", () => {
    // 2027-01-25 00:00 Pago Pago == 11:00Z.
    expect(formatInTz("2027-01-25T11:00:00.000Z", "Pacific/Pago_Pago")).toBe("25 Jan 2027");
    expect(formatInTz("2027-01-25T11:00:00.000Z", "UTC")).toBe("25 Jan 2027");
    expect(formatInTz("2027-01-25T11:00:00.000Z", "Pacific/Kiritimati")).toBe("26 Jan 2027");
    expect(formatInTz("2027-01-25T11:00:00.000Z", "Asia/Kolkata", "HH:mm")).toBe("16:30");
  });

  it("treats a yyyy-MM-dd string as its own calendar date", () => {
    expect(formatInTz("2027-01-25", "Pacific/Pago_Pago")).toBe("25 Jan 2027");
  });

  it("returns N/A for empty or invalid values", () => {
    expect(formatInTz(undefined, "UTC")).toBe("N/A");
    expect(formatInTz("garbage", "UTC")).toBe("N/A");
  });
});

describe("round trip: select -> submit -> reload -> same calendar date", () => {
  const zones = ["UTC", "America/Toronto", "Pacific/Pago_Pago", "Pacific/Kiritimati", "Asia/Kolkata", "EST"];
  const days: [number, number, number][] = [
    [2027, 1, 25],
    [2027, 3, 14],
    [2027, 7, 25],
    [2027, 11, 7],
  ];
  for (const tz of zones) {
    for (const [y, m, d] of days) {
      it(`${tz} ${y}-${m}-${d}`, () => {
        const sent = toZonedStartOfDayISO(picked(y, m, d), tz)!;
        // What the BE returns: the same instant, normalised to Z.
        const stored = new Date(sent).toISOString();
        expect(toCalendarDate(stored, tz)).toEqual(picked(y, m, d));
        const ymd = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        expect(formatInTz(stored, tz, "yyyy-MM-dd")).toBe(ymd);
      });
    }
  }
});

describe("legacy rule works on the parsed instant, whatever offset the API uses", () => {
  // The same stored instant, 2027-01-25T00:00:00.000Z, written in other offsets.
  const legacyForms = [
    "2027-01-25T00:00:00.000Z",
    "2027-01-25T00:00:00+00:00",
    "2027-01-24T16:00:00.000-08:00",
    "2027-01-25T13:00:00.000+13:00",
    "2027-01-24T19:00:00.000-05:00",
    "2027-01-25T05:30:00.000+05:30",
  ];
  const zones = ["UTC", "America/Toronto", "Pacific/Pago_Pago", "Pacific/Kiritimati", "Asia/Kolkata", undefined];
  for (const form of legacyForms) {
    it(`${form} is legacy and shows 25 Jan 2027 in every zone`, () => {
      expect(isLegacyUtcMidnight(form)).toBe(true);
      expect(isLegacyUtcMidnight(new Date(form))).toBe(true);
      for (const tz of zones) {
        expect(formatInTz(form, tz, "dd MMM yyyy")).toBe("25 Jan 2027");
        expect(formatInTz(form, tz, "yyyy-MM-dd")).toBe("2027-01-25");
        expect(toCalendarDate(form, tz)).toEqual(new Date(2027, 0, 25));
      }
    });
  }

  it("a real timed instant in an offset form is not legacy", () => {
    expect(isLegacyUtcMidnight("2027-01-24T16:30:00.000-08:00")).toBe(false);
    expect(isLegacyUtcMidnight("2027-01-25T00:00:00.000-11:00")).toBe(false);
    expect(isLegacyUtcMidnight("2027-01-25")).toBe(false);
  });
});

describe("rows without a timezone (list API) use the string's own offset, not the browser's", () => {
  it("renders the wall-clock date the API wrote, in any browser zone", () => {
    expect(formatInTz("2027-07-19T03:00:00.000-07:00", undefined, "dd MMM yyyy")).toBe("19 Jul 2027");
    expect(formatInTz("2027-07-20T00:00:00.000+14:00", undefined, "dd MMM yyyy")).toBe("20 Jul 2027");
    expect(formatInTz("2027-07-20T00:00:00.000+14:00", "", "dd MMM yyyy")).toBe("20 Jul 2027");
    expect(toCalendarDate("2027-07-20T00:00:00.000+05:30", null)).toEqual(new Date(2027, 6, 20));
  });

  it("a known record timezone still wins over the string's offset", () => {
    expect(formatInTz("2027-07-19T10:00:00.000Z", "Pacific/Kiritimati", "dd MMM yyyy")).toBe("20 Jul 2027");
  });
});
