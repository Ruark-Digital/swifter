import type { BidComparisonItem } from "../hooks/useEvaluationDetailApi";

/**
 * The bid-comparison API returns `total` converted to the company's base
 * currency (`total / rate`) and `rank` as a price-band label from the
 * backend's rankPrices() ("Lowest Price", "Competitive", "Fair Price",
 * "Highest Price", or "Normal" when every bid has the same price).
 */

/** Format a bid total in the proposal's own currency when it is known. */
export const formatBidTotal = (item: BidComparisonItem): string => {
  if (item.total == null) return "N/A";
  const companyCurrency = item.companyCurrency || item.currency || "USD";
  const proposalCurrency = item.currency || companyCurrency;
  // Undo the base-currency conversion to get the amount the vendor submitted.
  const amount =
    proposalCurrency === companyCurrency
      ? item.total
      : item.total * (item.rate || 1);
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: proposalCurrency,
  });
};

/** Human-readable rank; "Normal" (no price spread) and empty mean unranked. */
export const getBidRankLabel = (rank: unknown): string => {
  if (typeof rank === "number" && Number.isFinite(rank)) return `${rank}`;
  if (typeof rank !== "string") return "Unranked";
  const label = rank.trim();
  if (!label || label.toLowerCase() === "normal") return "Unranked";
  return label;
};
