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
 *   POST .../ai/redline-suggestions/{redlineId}/undo
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
  /** Room/document name for the version-hint fields below. */
  docName?: string;
  /** Client's last-known active version id (advisory; BE verifies server-side). */
  baseVersionId?: string | null;
  /**
   * Base64 Yjs document state (`Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString("base64")`).
   * Only populated when a live Y.Doc is available on the caller's side — this is
   * NEVER true for the default shipped editor (SuperDoc iframe has no host-side
   * Y.Doc). No call site in this repo currently supplies it; see the plan's
   * scoping note in 260724-onj-PLAN.md.
   */
  documentState?: string;
};

export type UndoRedlineInput = {
  redlineId: string;
  docName?: string;
  baseVersionId?: string | null;
};

/** One entry in a batch-resolve request (swagger: RedlineBatchResolutionRequest.resolutions[]). */
export type RedlineBatchItem = {
  redlineId: string;
  action: RedlineResolutionAction;
  /** Required by the BE when action === "modified". */
  tier?: "low" | "medium" | "high";
};

export type RedlineBatchResolveInput = {
  /** At least one resolution (BE enforces minItems: 1). */
  resolutions: RedlineBatchItem[];
  docName?: string;
  baseVersionId?: string | null;
  documentState?: string;
};

/** swagger: RedlineProgress. */
export type RedlineProgress = {
  total: number;
  pending: number;
  resolved: number;
  addressed: number;
  resolvedByManager: number;
  resolvedByVendor: number;
};

/** swagger: RedlineBatchResolutionResult (the `data` of the 200 envelope). */
export type RedlineBatchResolutionResult = {
  resolutions: Array<{
    redlineId: string;
    action?: RedlineResolutionAction;
    status?: "pending" | "resolved";
    tier?: "low" | "medium" | "high";
  }>;
  activeVersionId: string | null;
  progress: RedlineProgress;
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

/**
 * Build the resolve POST body: `action`/`tier` plus optional version-hint
 * fields, each included only when the caller explicitly supplied it (so
 * `baseVersionId: null` is preserved but a fully-omitted `baseVersionId` is
 * left out of the payload).
 */
export const buildResolvePayload = (
  input: { action: RedlineResolutionAction; tier?: "low" | "medium" | "high" },
  scope: {
    docName?: string;
    baseVersionId?: string | null;
    documentState?: string;
  },
): Record<string, unknown> => {
  const payload: Record<string, unknown> = { action: input.action };
  if (input.tier !== undefined) payload.tier = input.tier;
  if (scope.docName !== undefined) payload.docName = scope.docName;
  if (scope.baseVersionId !== undefined)
    payload.baseVersionId = scope.baseVersionId;
  if (scope.documentState !== undefined)
    payload.documentState = scope.documentState;
  return payload;
};

/** Build the undo POST body: version-hint fields, included only when supplied. */
export const buildUndoPayload = (scope: {
  docName?: string;
  baseVersionId?: string | null;
}): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  if (scope.docName !== undefined) payload.docName = scope.docName;
  if (scope.baseVersionId !== undefined)
    payload.baseVersionId = scope.baseVersionId;
  return payload;
};

/**
 * Build the batch-resolve POST body: the required `resolutions` array plus the
 * shared version-hint fields, each included only when the caller supplied it
 * (so `baseVersionId: null` is preserved but an omitted one is left out).
 */
export const buildBatchResolvePayload = (
  resolutions: RedlineBatchItem[],
  scope: {
    docName?: string;
    baseVersionId?: string | null;
    documentState?: string;
  },
): Record<string, unknown> => {
  const payload: Record<string, unknown> = { resolutions };
  if (scope.docName !== undefined) payload.docName = scope.docName;
  if (scope.baseVersionId !== undefined)
    payload.baseVersionId = scope.baseVersionId;
  if (scope.documentState !== undefined)
    payload.documentState = scope.documentState;
  return payload;
};

/** True when `error` is an axios-shaped error with HTTP status 409 (version/turn conflict). */
export const isVersionConflict = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === 409;

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
    mutationFn: async ({
      redlineId,
      action,
      tier,
      docName,
      baseVersionId,
      documentState,
    }) => {
      if (!base) return null;
      const payload = buildResolvePayload(
        { action, tier },
        { docName, baseVersionId, documentState },
      );
      const res = await postRequest({
        url: `${base}/ai/redline-suggestions/${redlineId}/resolve`,
        payload,
      });
      return res.data ?? null;
    },
    onError: (error, variables) => {
      if (isVersionConflict(error) && variables?.docName) {
        invalidate();
        qc.invalidateQueries({
          queryKey: ["collab-file-versions", variables.docName],
        });
      }
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn("[redline-resolve] audit call failed (non-blocking)", error);
      }
    },
  });

  // Reverts a previously-resolved suggestion back to pending. Unlike `resolve`
  // (fire-and-forget audit call), undo is a deliberate user action that needs
  // feedback on failure — so it throws (not silently no-ops) when the viewer
  // has no turn endpoint for this role.
  const undo = useMutation<unknown, unknown, UndoRedlineInput>({
    mutationKey: ["redline-undo", resource, documentId],
    mutationFn: async ({ redlineId, docName, baseVersionId }) => {
      if (!base) throw new Error("Redline turn is not available for this role.");
      const payload = buildUndoPayload({ docName, baseVersionId });
      const res = await postRequest({
        url: `${base}/ai/redline-suggestions/${redlineId}/undo`,
        payload,
      });
      return res.data ?? null;
    },
    onError: (error, variables) => {
      if (isVersionConflict(error) && variables?.docName) {
        invalidate();
        qc.invalidateQueries({
          queryKey: ["collab-file-versions", variables.docName],
        });
      }
    },
  });

  // Resolve every supplied redline in ONE call — backs the "resolve all
  // pending" bulk action. A deliberate user action, so it THROWS on failure
  // (mirrors `undo`, not the fire-and-forget single `resolve`).
  // Endpoint: POST .../ai/redline-suggestions/batch-resolve.
  const batchResolve = useMutation<
    RedlineBatchResolutionResult | null,
    unknown,
    RedlineBatchResolveInput
  >({
    mutationKey: ["redline-batch-resolve", resource, documentId],
    mutationFn: async ({ resolutions, docName, baseVersionId, documentState }) => {
      if (!base) throw new Error("Redline turn is not available for this role.");
      if (resolutions.length === 0) return null;
      const payload = buildBatchResolvePayload(resolutions, {
        docName,
        baseVersionId,
        documentState,
      });
      const res = await postRequest({
        url: `${base}/ai/redline-suggestions/batch-resolve`,
        payload,
      });
      return (res.data as ApiEnvelope<RedlineBatchResolutionResult>)?.data ?? null;
    },
    onError: (error, variables) => {
      if (isVersionConflict(error) && variables?.docName) {
        invalidate();
        qc.invalidateQueries({
          queryKey: ["collab-file-versions", variables.docName],
        });
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
    undo,
    batchResolve,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
