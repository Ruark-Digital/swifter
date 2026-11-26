import { describe, expect, it } from "vitest";
import { formatBidTotal, getBidRankLabel } from "../bidComparison";
import type { BidComparisonItem } from "../../hooks/useEvaluationDetailApi";

const item = (over: Partial<BidComparisonItem>): BidComparisonItem => ({
  proposalId: "p1",
  vendorName: "V",
  vendorEmail: null,
  total: 1,
  score: 0,
  submission: null,
  rank: "Normal",
  currency: "USD",
  companyCurrency: "CAD",
  rate: 1,
  ...over,
});

describe("formatBidTotal (S1-FE-16)", () => {
  it("shows a USD proposal in USD, not CA$", () => {
    expect(formatBidTotal(item({}))).toBe("$1.00");
  });
  it("undoes the base-currency conversion using rate", () => {
    // API total is CAD (= USD amount / rate); vendor submitted 100 USD.
    expect(formatBidTotal(item({ total: 100 / 0.73, rate: 0.73 }))).toBe(
      "$100.00"
    );
  });
  it("uses company currency when the proposal currency is unknown", () => {
    expect(formatBidTotal(item({ currency: null, total: 5 }))).toBe("CA$5.00");
  });
  it("shows N/A for a missing total", () => {
    expect(formatBidTotal(item({ total: null }))).toBe("N/A");
  });
});

describe("getBidRankLabel (S1-FE-16)", () => {
  it("never shows the backend's 'Normal' placeholder", () => {
    expect(getBidRankLabel("Normal")).toBe("Unranked");
    expect(getBidRankLabel("")).toBe("Unranked");
    expect(getBidRankLabel(null)).toBe("Unranked");
  });
  it("keeps meaningful price-band labels", () => {
    expect(getBidRankLabel("Lowest Price")).toBe("Lowest Price");
  });
});
