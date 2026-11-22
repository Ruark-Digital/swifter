import type { ContractClaimDTO } from "../api/contractManagerApi";

/**
 * Effective status of a claim for display + action gating.
 *
 * QA: a rejected claim kept showing "Under Review" — on a manager/approver
 * rejection the BE records the decision on `manager.status` / the approver
 * entries while the top-level `status` can stay "under review" (the same
 * pattern HoldbackDetailsSheet works around). A rejection at any step ends the
 * claim, so while the top-level status is still "under review" we surface any
 * recorded rejection as "rejected". This also unlocks the Vendor PM's
 * Resubmit action, which is gated on a rejected status.
 */
export const getEffectiveClaimStatus = (
  claim?: Pick<ContractClaimDTO, "status" | "manager" | "approvers"> | null,
): string => {
  const status = (claim?.status ?? "").toLowerCase();
  if (status !== "under review") return status;

  const isRejected = (s?: string) => (s ?? "").toLowerCase() === "rejected";
  const rejectedByManager = isRejected(claim?.manager?.status);
  const rejectedByApprover = (claim?.approvers ?? []).some(
    (level) =>
      isRejected(level?.levelStatus) ||
      (level?.user ?? []).some((u) => isRejected(u?.status)),
  );
  return rejectedByManager || rejectedByApprover ? "rejected" : status;
};
