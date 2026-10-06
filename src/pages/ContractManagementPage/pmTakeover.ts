import type { ContractDetail } from "@/types";

/** A pending-or-approved PM assignment as returned on the contract detail. */
type PmAssignmentLike = {
  user?:
    | string
    | { _id?: string; name?: string; user?: { name?: string } }
    | null;
  status?: string;
};

export type PendingPmTakeover = {
  pending: boolean;
  /** Resolved display name of the requesting PM, when the BE populated it.
   *  Undefined when the user is returned as a bare ObjectId string. */
  requesterName?: string;
};

/**
 * Resolve the pending PM take-over request from a contract detail, absorbing the
 * BE response-shape drift documented in the PM-assignment guide (docs v2.3.0).
 *
 * The deployed BE returns the pending assignment in a dedicated
 * `pendingProjectManager` object and leaves `projectManager` null until the CM
 * approves. The legacy shape (still covered by the take-over Playwright test)
 * put the pending assignment in `projectManager` with `status === "pending"`.
 * Read either, preferring the new field.
 */
export function resolvePendingPmTakeover(
  contract:
    | Partial<Pick<ContractDetail, "projectManager" | "pendingProjectManager">>
    | null
    | undefined,
): PendingPmTakeover {
  const pendingAssignment: PmAssignmentLike | undefined =
    (contract?.pendingProjectManager as PmAssignmentLike | undefined)
      ?.status === "pending"
      ? (contract?.pendingProjectManager as PmAssignmentLike)
      : (contract?.projectManager as PmAssignmentLike | undefined)?.status ===
          "pending"
        ? (contract?.projectManager as PmAssignmentLike)
        : undefined;

  if (!pendingAssignment) return { pending: false };

  const u = pendingAssignment.user;
  const requesterName =
    u && typeof u !== "string" ? (u.user?.name ?? u.name ?? undefined) : undefined;

  return { pending: true, requesterName };
}
