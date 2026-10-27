import { describe, it, expect } from "vitest";
import { formatCurrency } from "../utils";

// QA #299 — currency display must be deterministic across users. The same
// contract value was rendering with different symbols per logged-in user
// because an omitted/undefined locale fell back to the viewer's own locale
// (USD → "$" in en-US but "US$" in en-CA; CAD → "CA$" vs "$").
describe("formatCurrency — deterministic locale", () => {
  it("renders USD/CAD in a fixed locale regardless of the viewer", () => {
    // en-US: USD is "$…", CAD is "CA$…" — never "US$" / bare "$" for CAD.
    expect(formatCurrency(1000, "en-US", "USD")).toContain("$");
    expect(formatCurrency(1000, "en-US", "USD")).not.toContain("US$");
    expect(formatCurrency(1000, "en-US", "CAD")).toContain("CA$");
  });

  it("falls back to the fixed locale when none is given (not the viewer's)", () => {
    // An undefined locale must produce the SAME output as the fixed locale,
    // so all users see identical formatting.
    expect(formatCurrency(1000, undefined, "USD")).toBe(
      formatCurrency(1000, "en-US", "USD"),
    );
    expect(formatCurrency(1000, undefined, "CAD")).toBe(
      formatCurrency(1000, "en-US", "CAD"),
    );
  });

  it("tolerates the two-arg misuse formatCurrency(amount, currencyCode)", () => {
    // `formatCurrency(value, "USD")` (currency in the locale slot) must resolve
    // to the same result as the correct three-arg call, not a bare number.
    expect(formatCurrency(1000, "USD")).toBe(
      formatCurrency(1000, "en-US", "USD"),
    );
    expect(formatCurrency(1000, "CAD")).toBe(
      formatCurrency(1000, "en-US", "CAD"),
    );
  });
});
