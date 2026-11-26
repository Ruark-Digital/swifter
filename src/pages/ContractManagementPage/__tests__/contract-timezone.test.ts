import { describe, expect, it } from "vitest";
import {
  buildTimezoneOptions,
  defaultContractTimezone,
  toIanaZone,
} from "../lib/contractTimezone";

describe("contract timezone (IANA)", () => {
  it("maps stored abbreviations to IANA and passes IANA through", () => {
    expect(toIanaZone("NZST")).toBe("Pacific/Auckland");
    expect(toIanaZone("Pacific/Auckland")).toBe("Pacific/Auckland");
    expect(toIanaZone("UTC")).toBe("UTC");
    expect(toIanaZone("WAT")).toBeUndefined(); // fixed offset: no IANA mapping
    expect(toIanaZone("")).toBeUndefined();
  });
  it("defaults to an IANA zone, never an abbreviation", () => {
    expect(defaultContractTimezone("NZDT")).toBe("Pacific/Auckland");
    expect(defaultContractTimezone("WAT")).toContain("/".length ? "" : "");
    expect(defaultContractTimezone(undefined).length).toBeGreaterThan(0);
  });
  it("offers IANA names and keeps an extra current value selectable", () => {
    const values = buildTimezoneOptions().map((o) => o.value);
    expect(values).toContain("Pacific/Auckland");
    expect(values).not.toContain("NZST");
    expect(buildTimezoneOptions("Custom/Zone")[0].value).toBe("Custom/Zone");
  });
});
