import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * Turn-based redline negotiation (design:
 * docs/superpowers/specs/2026-07-01-redline-turn-negotiation-design.md).
 *
 * The company side (CM/Procurement = `manager`) and the vendor side
 * (Vendor/PM = `vendor`) take turns editing/accepting redlines. Only the
 * current `holder` may mutate redlines; the other side is read-only until the
 * turn is handed back. Backend endpoints (shipped 2026-07-16), role-prefixed
 * under `/contract/{manager|vendor}/{contracts|msa-contracts}/{id}`:
 *   GET  .../redline-turn
 *   POST .../redline-turn/send
 *   POST .../redline-turn/finalize
 *   POST .../ai/redline-suggestions/{redlineId}/resolve
 */

export type RedlineHolder = "manager" | "vendor";
export type RedlineTurnStatus = "in_progress" | "finalized";

export type RedlineTurn = {
  holder: RedlineHolder;
  status: RedlineTurnStatus;
  updatedAt: string;
  updatedBy: { id: string; name: string; role: string };
};

export type RedlineResolutionAction = "accepted" | "modified" | "rejected";

export type RedlineResolveInput = {
  redlineId: string;
  action: RedlineResolutionAction;
  /** Required by the BE when action === "modified". */
  tier?: "low" | "medium" | "high";
};

type ApiEnvelope<T> = { status?: number; message?: string; data?: T };

export type RedlineTurnScope = {
  /** Contract or MSA-contract id. */
  documentId: string | undefined;
  /** Default false → /contracts; true → /msa-contracts. */
  isMsa?: boolean;
};

/**
 * Map the current role to a negotiating side. Only `manager` (CM/Procurement)
 * and `vendor` (Vendor/PM) participate; everyone else (approver, view-only,
 * company/super admin, evaluator) is a non-participant observer with no turn.
 */
export const redlineSideFromRole = (role: {
  isManager: boolean;
  isVendor: boolean;
  isProjectManager: boolean;
}): RedlineHolder | null => {
  if (role.isManager) return "manager";
  if (role.isVendor || role.isProjectManager) return "vendor";
  return null;
};

export function useRedlineTurn({ documentId, isMsa }: RedlineTurnScope) {
  const role = useUserRole();
  const qc = useQueryClient();
  const mySide = redlineSideFromRole(role);
  const resource = isMsa ? "msa-contracts" : "contracts";
  // axios baseURL is /api/v1/dev — swagger paths live under /contract. Only the
  // two negotiating sides have turn endpoints; others get no base → read-only.
  const base =
    documentId && mySide
      ? `/contract/${mySide}/${resource}/${documentId}`
      : null;

  const queryKey = ["redline-turn", mySide, resource, documentId] as const;

  const query = useQuery<RedlineTurn | null>({
    queryKey,
    enabled: Boolean(base),
    queryFn: async () => {
      const res = await getRequest({ url: `${base}/redline-turn` });
      return (res.data as ApiEnvelope<RedlineTurn>)?.data ?? null;
    },
    staleTime: 15000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const sendTurn = useMutation<RedlineTurn | null, unknown, void>({
    mutationKey: ["redline-turn-send", resource, documentId],
    mutationFn: async () => {
      if (!base) throw new Error("Redline turn is not available for this role.");
      const res = await postRequest({
        url: `${base}/redline-turn/send`,
        payload: {},
      });
      return (res.data as ApiEnvelope<RedlineTurn>)?.data ?? null;
    },
    onSuccess: () => invalidate(),
  });

  const finalize = useMutation<RedlineTurn | null, unknown, void>({
    mutationKey: ["redline-turn-finalize", resource, documentId],
    mutationFn: async () => {
      if (!base) throw new Error("Redline turn is not available for this role.");
      const res = await postRequest({
        url: `${base}/redline-turn/finalize`,
        payload: {},
      });
      return (res.data as ApiEnvelope<RedlineTurn>)?.data ?? null;
    },
    onSuccess: () => invalidate(),
  });

  // Audit-only: records who resolved a suggestion and how. Does NOT mutate the
  // document (the client already did that via replaceRedline). Fire-and-forget.
  const resolve = useMutation<unknown, unknown, RedlineResolveInput>({
    mutationKey: ["redline-resolve", resource, documentId],
    mutationFn: async ({ redlineId, action, tier }) => {
      if (!base) return null;
      const payload =
        action === "modified" && tier ? { action, tier } : { action };
      const res = await postRequest({
        url: `${base}/ai/redline-suggestions/${redlineId}/resolve`,
        payload,
      });
      return res.data ?? null;
    },
    onError: (error) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[redline-resolve] audit call failed (non-blocking)", error);
      }
    },
  });

  const turn = query.data ?? null;
  const isParticipant = mySide !== null;
  const isFinalized = turn?.status === "finalized";
  // Authoritative turn state is present (query succeeded with a turn object).
  const turnGateReady = query.isSuccess && turn != null;
  const isMyTurn = Boolean(
    mySide && turn && turn.holder === mySide && !isFinalized,
  );
  // Whether the viewer may act on redlines (apply/dismiss).
  // - Participants: allowed on their turn; blocked when it's the other side's
  //   turn or negotiation is finalized. If authoritative turn state hasn't
  //   loaded yet, don't hard-block — a missing turn record shouldn't strand a
  //   participant mid-session.
  // - Non-participants (approver/view-only/admin/etc.): always read-only wrt
  //   redline actions (they can still comment).
  const canAct = isParticipant
    ? turnGateReady
      ? isMyTurn
      : true
    : false;
  const isLocked = !canAct;

  return {
    turn,
    mySide,
    isParticipant,
    isMyTurn,
    isFinalized,
    /** Positive gate: viewer may apply/dismiss redlines right now. */
    canAct,
    /** Inverse of `canAct` — convenient for guard clauses. */
    isLocked,
    /** True when we have loaded authoritative turn state. */
    turnGateReady,
    sendTurn,
    finalize,
    resolve,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
