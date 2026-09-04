import { describe, it, expect } from "vitest";
import { diffChangedPayload } from "../contractFormValues";

describe("diffChangedPayload — send only changed fields on Edit Contract", () => {
  it("keeps only keys whose value differs from the baseline", () => {
    const base = { title: "A", description: "same", amount: 10 };
    const full = { title: "B", description: "same", amount: 10 };
    expect(diffChangedPayload(full, base)).toEqual({ title: "B" });
  });

  it("deep-compares nested objects and arrays (unchanged → excluded)", () => {
    const insurance = { insurance: "Yes", policy: [{ name: "COI", limit: "1M" }] };
    const base = { insurance, dates: { start: "2026-01-01" } };
    const full = {
      insurance: { insurance: "Yes", policy: [{ name: "COI", limit: "1M" }] },
      dates: { start: "2026-02-01" },
    };
    // insurance is structurally equal → excluded; dates changed → included.
    expect(diffChangedPayload(full, base)).toEqual({
      dates: { start: "2026-02-01" },
    });
  });

  it("includes a key present in full but absent from the baseline", () => {
    expect(diffChangedPayload({ currencyRate: 1.3 }, {})).toEqual({
      currencyRate: 1.3,
    });
  });

  it("always includes `alwaysInclude` keys even when unchanged", () => {
    const base = { title: "A", status: "draft", timezone: "UTC" };
    const full = { title: "A", status: "draft", timezone: "UTC" };
    expect(diffChangedPayload(full, base, ["status", "timezone"])).toEqual({
      status: "draft",
      timezone: "UTC",
    });
  });

  it("ignores alwaysInclude keys that aren't present in full", () => {
    expect(diffChangedPayload({ title: "B" }, { title: "A" }, ["missing"])).toEqual({
      title: "B",
    });
  });

  it("returns an empty object when nothing changed and nothing is forced", () => {
    expect(diffChangedPayload({ a: 1, b: 2 }, { a: 1, b: 2 })).toEqual({});
  });
});
