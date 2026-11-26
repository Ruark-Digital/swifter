import { describe, it, expect } from "vitest";
import { matchTimezoneOption } from "../timezoneOption";
import timezones from "@/assets/timezones.json";

describe("matchTimezoneOption", () => {
  it("returns an exact option value", () => {
    expect(matchTimezoneOption("WAT", timezones)).toBe("WAT");
    expect(matchTimezoneOption("est", timezones)).toBe("EST");
  });
  it("maps a daylight abbreviation to the option for the same zone", () => {
    expect(matchTimezoneOption("NZDT", timezones)).toBe("NZST");
    expect(matchTimezoneOption("EDT", timezones)).toBe("EST");
  });
  it("maps an IANA name to its abbreviation option", () => {
    expect(matchTimezoneOption("Pacific/Auckland", timezones)).toBe("NZST");
  });
  it("returns undefined for empty or unknown zones", () => {
    expect(matchTimezoneOption("", timezones)).toBeUndefined();
    expect(matchTimezoneOption("Not/AZone", timezones)).toBeUndefined();
  });
});
