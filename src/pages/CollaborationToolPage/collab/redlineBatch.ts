import type { RedlineAcceptance } from "./useAiRedlineSuggestions";
import type { RedlineBatchItem, RedlineHolder } from "./useRedlineTurn";

/** The server-side fields a batch is filtered on, from a freshly fetched suggestion. */
export type BatchCandidate = {
  redlineId: string;
  resolution?: { action?: string } | null;
  accepted?: RedlineAcceptance;
};

/** Resolution actions the server persists once a suggestion is resolved. */
const RESOLVED_ACTIONS = new Set(["accepted", "modified", "rejected"]);

const acceptedBySide = (
  accepted: RedlineAcceptance | undefined,
  mySide: RedlineHolder | null,
): boolean => {
  if (mySide === "manager") return Boolean(accepted?.cmAccepted);
  if (mySide === "vendor") return Boolean(accepted?.vendorAccepted);
  return false;
};

/**
 * Build the batch-resolve items from the server's current suggestions. Skips
 * any suggestion the server already shows as resolved, or as accepted by this
 * side, so a stale or repeated click never resends it (that is what caused the
 * 409 "missing or already resolved").
 */
export const buildBatchItems = (
  suggestions: BatchCandidate[],
  {
    action,
    tier,
    mySide,
  }: {
    action: "modified" | "rejected";
    tier: "low" | "medium" | "high";
    mySide: RedlineHolder | null;
  },
): RedlineBatchItem[] =>
  suggestions
    .filter(
      (s) =>
        !RESOLVED_ACTIONS.has(s.resolution?.action ?? "") &&
        !acceptedBySide(s.accepted, mySide),
    )
    .map((s) =>
      action === "modified"
        ? { redlineId: s.redlineId, action, tier, appliedTier: tier }
        : { redlineId: s.redlineId, action },
    );
