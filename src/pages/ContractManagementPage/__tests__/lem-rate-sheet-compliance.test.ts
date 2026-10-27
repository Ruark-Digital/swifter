import { describe, expect, it } from "vitest";
import { deriveLemRateSheetComparison } from "../api/contractManagerApi";

// Client: the LEM Overview "Rate Sheet Compliance" indicator "doesn't look
// accurate". Root cause was the fallback reading stale rateSheet keys
// (rateSheetTotal / items[] / compliant) that no longer exist — the current BE
// shape is { total, variance, status: "Compliance" | "Non-Compliance" }.
describe("deriveLemRateSheetComparison (LEM Rate Sheet Compliance)", () => {
  it("prefers the authoritative summary.comparison when populated", () => {
    const result = deriveLemRateSheetComparison(
      {
        total: 1200,
        rateSheetTotal: 1000,
        totalVariance: 200,
        complianceStatus: "Non-Compliant",
      },
      { total: 999, variance: 1, status: "Compliance" },
    );
    expect(result).toEqual({
      total: 1200,
      rateSheetTotal: 1000,
      totalVariance: 200,
      complianceStatus: "Non-Compliant",
    });
  });

  it("falls back to the current rateSheet shape when comparison totals are null", () => {
    // This is the regression: comparison present but totals null; the values
    // live on rateSheet { total, variance, status }.
    const result = deriveLemRateSheetComparison(
      {
        total: 1500,
        rateSheetTotal: null,
        totalVariance: null,
        complianceStatus: null,
      },
      { total: 1000, variance: 500, status: "Non-Compliance" },
    );
    expect(result?.rateSheetTotal).toBe(1000);
    expect(result?.totalVariance).toBe(500);
    // "Non-Compliance" maps onto the badge's "Non-Compliant" label.
    expect(result?.complianceStatus).toBe("Non-Compliant");
  });

  it("maps rateSheet status 'Compliance' to 'Fully Compliant'", () => {
    const result = deriveLemRateSheetComparison(undefined, {
      total: 1000,
      variance: 0,
      status: "Compliance",
    });
    expect(result?.complianceStatus).toBe("Fully Compliant");
    expect(result?.rateSheetTotal).toBe(1000);
    expect(result?.totalVariance).toBe(0);
  });

  it("still supports the legacy rateSheet shape (items/compliant)", () => {
    const result = deriveLemRateSheetComparison(undefined, {
      rateSheetTotal: 800,
      compliant: false,
      items: [{ variance: 50 }, { variance: 30 }, { variance: null }],
    });
    expect(result?.rateSheetTotal).toBe(800);
    expect(result?.totalVariance).toBe(80);
    expect(result?.complianceStatus).toBe("Non-Compliant");
  });

  it("returns undefined when there is no rate-sheet data at all", () => {
    expect(deriveLemRateSheetComparison(undefined, undefined)).toBeUndefined();
    expect(deriveLemRateSheetComparison(null, {})).toBeUndefined();
  });
});
