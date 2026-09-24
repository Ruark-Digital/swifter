import { useMutation, useQuery } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import type { RedlineSpan } from "./redlineScan";

export type AiRiskLevel = "high" | "medium" | "low";

/** Acceptability verdict — short label rendered as a status pill. */
export type AiAcceptability =
  | "acceptable"
  | "conditionally-acceptable"
  | "not-acceptable"
  | string; // tolerate future BE values

/** Per-domain considerations broken out by the AI. */
export type AiConsiderations = {
  legal?: string;
  commercial?: string;
  technical?: string;
};

/**
 * Three risk-tiered replacement texts. The user picks which to apply.
 * - `low`: most conservative, removes nearly all enforceable language.
 * - `medium`: balanced — preserves intent, adds qualifiers.
 * - `high`: keeps original meaning, adds minimal disclaimers.
 */
export type AiAlternativeLanguage = {
  low?: string;
  medium?: string;
  high?: string;
};

/**
 * Per-redline analysis returned by the backend.
 * Swagger schema: RedlineAnalysisResultItem.
 */
export type AiRedlineSuggestion = {
  redlineId: string;
  /** Original document text associated with a persisted redline suggestion. */
  sourceText?: string;
  /** Full paragraph analysis of what the redline changes and why it matters. */
  assessment: string;
  /** Free-text recommendation summary (e.g. "This change should not be
   *  accepted as-is due to the risk of …"). NOT a short verdict — that's
   *  `acceptability`. */
  suggestion: string;
  /** Short verdict — typically "acceptable" / "conditionally-acceptable"
   *  / "not-acceptable". Rendered as a status pill. */
  acceptability?: AiAcceptability;
  /** Per-domain considerations. */
  considerations?: AiConsiderations;
  /** Risk-tiered replacement options. The user picks one before applying. */
  alternativeLanguage?: AiAlternativeLanguage;
  /** Actionable next-step text the AI proposes (escalate, propose, etc.). */
  solution?: string;
  /** Risk level for this single redline. */
  riskLevel: AiRiskLevel;
  /** @deprecated Pre-v2 BE field. Use `alternativeLanguage` tiers. Kept
   *  for back-compat when older deployments still return it. */
  replacementText?: string;
};

/**
 * Aggregate analysis returned alongside the per-redline suggestions.
 * Swagger schema: RedlineAnalysisResult.
 */
export type AiRedlineAnalysis = {
  summary: string;
  riskLevel: AiRiskLevel;
  /** Aggregate verdict for the whole document. */
  acceptability?: AiAcceptability;
  considerations?: AiConsiderations;
  /** Free-text aggregate recommendation. */
  overallSuggestion: string;
  /** Aggregate actionable next step. */
  overallSolution?: string;
  suggestions: AiRedlineSuggestion[];
};

type ApiResponseBody = {
  status?: number;
  message?: string;
  data?: {
    summary?: string;
    riskLevel?: AiRiskLevel;
    acceptability?: AiAcceptability;
    considerations?: AiConsiderations;
    overallSuggestion?: string;
    overallSolution?: string;
    redlineAnalysis?: Array<{
      redlineId?: string;
      assessment?: string;
      suggestion?: string;
      acceptability?: AiAcceptability;
      considerations?: AiConsiderations;
      alternativeLanguage?: AiAlternativeLanguage;
      solution?: string;
      riskLevel?: AiRiskLevel;
      replacementText?: string;
    }>;
  };
};

export type AiRedlineScope = {
  /** Required — id of the contract or MSA contract being analysed. */
  documentId: string | undefined;
  /** Default false → /contracts/...; true → /msa-contracts/... */
  isMsa?: boolean;
};

const buildEndpoint = ({
  documentId,
  isMsa,
  isManager,
  isVendor,
  isProjectManager,
  redlineDocumentId,
}: {
  documentId: string;
  isMsa: boolean;
  isManager: boolean;
  isVendor: boolean;
  isProjectManager: boolean;
  /**
   * The document (file) id. The GET list route requires it in the path
   * (`.../{contractId}/ai/{documentId}/redline-suggestions`); the POST generate
   * route omits it here and carries it in the body instead (RedlineAnalysisDTO).
   */
  redlineDocumentId?: string;
}): string | null => {
  const resource = isMsa ? "msa-contracts" : "contracts";
  const role = isManager
    ? "manager"
    : isVendor || isProjectManager
      ? "vendor"
      : null;
  if (!role) return null;
  // axios baseURL is /api/v1/dev — swagger paths live under /contract.
  const aiPath = redlineDocumentId
    ? `ai/${redlineDocumentId}/redline-suggestions`
    : "ai/redline-suggestions";
  return `/contract/${role}/${resource}/${documentId}/${aiPath}`;
};

/**
 * Max redlines per BE request. The backend proxies each request to an LLM;
 * sending every redline of a large document in one POST overloads that proxy
 * (manifests as a "Network Error"/timeout). We send the redlines in chunks of
 * this size, one batch at a time, and merge the per-redline results.
 */
const BATCH_SIZE = 100;

const chunkRedlines = (redlines: RedlineSpan[], size: number): RedlineSpan[][] => {
  const batches: RedlineSpan[][] = [];
  for (let i = 0; i < redlines.length; i += size) {
    batches.push(redlines.slice(i, i + size));
  }
  return batches;
};

/**
 * Ensure every redline carries a `documentPosition` so the BE can return the
 * persisted GET list in document order. Editors that know the real offset set
 * it on the span; otherwise fall back to the span's index — `extractRedlines`
 * returns spans in document order, so the index preserves that order. Must run
 * before chunking so positions stay global across batches.
 */
export const withDocumentPositions = (redlines: RedlineSpan[]): RedlineSpan[] =>
  redlines.map((r, index) => ({
    ...r,
    documentPosition: r.documentPosition ?? index,
  }));

/** Parse one BE response body into an `AiRedlineAnalysis`. */
const parseAnalysisBody = (body: ApiResponseBody): AiRedlineAnalysis => {
  const data = body?.data ?? {};
  const suggestions: AiRedlineSuggestion[] = Array.isArray(data.redlineAnalysis)
    ? data.redlineAnalysis
        .filter((s) => Boolean(s?.redlineId))
        .map((s) => ({
          redlineId: s.redlineId as string,
          assessment: s.assessment ?? "",
          suggestion: typeof s.suggestion === "string" ? s.suggestion : "",
          acceptability: s.acceptability,
          considerations: s.considerations,
          alternativeLanguage: s.alternativeLanguage,
          solution: typeof s.solution === "string" ? s.solution : undefined,
          riskLevel: s.riskLevel ?? "medium",
          replacementText:
            typeof s.replacementText === "string" ? s.replacementText : undefined,
        }))
    : [];
  return {
    summary: data.summary ?? "",
    riskLevel: data.riskLevel ?? "low",
    acceptability: data.acceptability,
    considerations: data.considerations,
    overallSuggestion:
      typeof data.overallSuggestion === "string" ? data.overallSuggestion : "",
    overallSolution:
      typeof data.overallSolution === "string" ? data.overallSolution : undefined,
    suggestions,
  };
};

const RISK_RANK: Record<AiRiskLevel, number> = { low: 0, medium: 1, high: 2 };

/**
 * Fold the per-batch analyses into a single result: concatenate the per-redline
 * suggestions and combine the aggregate fields (highest risk wins, first
 * non-empty free-text wins). The UI currently only reads `suggestions`, but the
 * aggregates are merged correctly so callers can rely on them later.
 */
const mergeAnalyses = (parts: AiRedlineAnalysis[]): AiRedlineAnalysis => {
  const empty: AiRedlineAnalysis = {
    summary: "",
    riskLevel: "low",
    overallSuggestion: "",
    suggestions: [],
  };
  if (parts.length === 0) return empty;
  if (parts.length === 1) return parts[0];
  return parts.reduce((acc, part) => ({
    summary: acc.summary || part.summary,
    riskLevel:
      RISK_RANK[part.riskLevel] > RISK_RANK[acc.riskLevel]
        ? part.riskLevel
        : acc.riskLevel,
    acceptability: acc.acceptability ?? part.acceptability,
    considerations: acc.considerations ?? part.considerations,
    overallSuggestion: acc.overallSuggestion || part.overallSuggestion,
    overallSolution: acc.overallSolution ?? part.overallSolution,
    suggestions: [...acc.suggestions, ...part.suggestions],
  }));
};

/**
 * Sends the redlined spans to the backend (which proxies to an LLM) and
 * returns one assessment + accept/reject/negotiate recommendation per
 * `redlineId`, plus an aggregate risk verdict for the document.
 *
 * Redlines are sent in batches of at most {@link BATCH_SIZE} per request, one
 * batch at a time, and the per-batch results are merged — a single POST with
 * every redline overloads the LLM proxy on large documents.
 *
 * Swagger endpoints (all share the same request/response shape):
 *   POST /manager|vendor/contracts/{contractId}/ai/redline-suggestions
 *   POST /manager|vendor/msa-contracts/{contractId}/ai/redline-suggestions
 *
 * Approver and view-only (user) roles have no live endpoint — buildEndpoint
 * resolves url=null for them, which the mutationFn null-url guard below
 * turns into a benign no-op result.
 *
 * Body:     { documentId, redlines: RedlineSpan[] }  (≤ BATCH_SIZE spans per
 *           request; each span carries `documentPosition`)
 * 200 data: { summary, riskLevel, overallSuggestion, redlineAnalysis: [...] }
 */
export function useAiRedlineSuggestions({
  documentId,
  fileId,
  isMsa,
}: AiRedlineScope & { fileId?: string }) {
  const role = useUserRole();
  const url = documentId
    ? buildEndpoint({
        documentId,
        isMsa: Boolean(isMsa),
        isManager: role.isManager,
        isVendor: role.isVendor,
        isProjectManager: role.isProjectManager,
      })
    : null;

  return useMutation<AiRedlineAnalysis, unknown, RedlineSpan[]>({
    mutationKey: ["ai-redline-suggestions", url, fileId],
    mutationFn: async (redlines) => {
      if (!url) {
        return {
          summary: "",
          riskLevel: "low",
          overallSuggestion: "accept",
          suggestions: [],
        };
      }
      // Send at most BATCH_SIZE redlines per request, one batch at a time, then
      // merge the per-batch analyses. A batch failure rejects the whole
      // mutation (preserving the panel's error/Retry behaviour). The BE's
      // RedlineAnalysisDTO is `.strict()` and requires the document (file) id in
      // the body — send exactly { documentId, redlines }.
      const parts: AiRedlineAnalysis[] = [];
      for (const batch of chunkRedlines(
        withDocumentPositions(redlines),
        BATCH_SIZE,
      )) {
        const res = await postRequest({
          url,
          payload: { documentId: fileId, redlines: batch },
        });
        parts.push(parseAnalysisBody(res.data as ApiResponseBody));
      }
      return mergeAnalyses(parts);
    },
  });
}

// ── Persisted suggestions (GET) ──────────────────────────────────────

/** Which side resolved a redline: the company/manager or the vendor PM. */
export type RedlineResolvedHolder = "manager" | "vendor";

export type PersistedResolution = {
  status?: "pending" | "resolved" | string;
  action?: "accepted" | "modified" | "rejected";
  tier?: "low" | "medium" | "high";
  /**
   * Who resolved the redline. Swagger `RedlineResolution.resolvedBy` is an
   * object; the `holder` distinguishes a manager-side "Addressed" from a
   * vendor-side "Resolved" (#87). Older deployments may send a bare string.
   */
  resolvedBy?:
    | {
        holder?: RedlineResolvedHolder;
        userId?: string;
        role?: string;
        at?: string;
      }
    | string;
  /** Which alternativeLanguage tier was applied on bilateral acceptance. */
  appliedTier?: "low" | "medium" | "high";
  /** The exact text the BE recorded as applied to the document — authoritative
   *  replacement string, preferred over re-deriving from alternativeLanguage. */
  appliedText?: string;
  /** When/who applied the suggestion (audit). */
  appliedAt?: string;
  appliedBy?: { id?: string; name?: string } | string;
};

export type PersistedSuggestion = AiRedlineSuggestion & {
  resolution?: PersistedResolution;
  /** Per-redline bilateral acceptance (dual-approval). */
  accepted?: RedlineAcceptance;
};

/** Normalize `resolution.resolvedBy` (object or legacy string) to the holder. */
export const getRedlineResolvedHolder = (
  resolution?: PersistedResolution,
): RedlineResolvedHolder | undefined => {
  const rb = resolution?.resolvedBy;
  if (!rb) return undefined;
  if (typeof rb === "string") {
    return rb === "manager" || rb === "vendor" ? rb : undefined;
  }
  return rb.holder;
};

/**
 * #87 — stage word for a resolved redline. It is "Resolved" only once the
 * Vendor PM has accepted it; a manager-side accept/dismiss reads "Addressed"
 * (the redline is handled on the company side but the vendor hasn't accepted).
 */
export const redlineStageLabel = (
  holder?: RedlineResolvedHolder,
): "Resolved" | "Addressed" => (holder === "vendor" ? "Resolved" : "Addressed");

// ── Bilateral (dual-approval) acceptance ─────────────────────────────
// The BE tracks, per redline, whether each side has accepted. A redline is
// applied to the document only once BOTH the contract manager (CM) and the
// vendor PM accept it; until then the other side sees a request to approve or
// reject. Swagger schema: RedlineAcceptanceStatus (on each suggestion's
// `accepted`).

export type RedlineAcceptedByUser = { id?: string; name?: string };

/** `pending` = nobody accepted; `cm_accepted`/`vendor_accepted` = one side
 *  accepted, awaiting the other; `both_accepted` = apply. */
export type RedlineAcceptanceState =
  | "both_accepted"
  | "cm_accepted"
  | "vendor_accepted"
  | "pending";

export type RedlineAcceptance = {
  redlineId?: string;
  cmAccepted?: boolean;
  vendorAccepted?: boolean;
  cmAcceptedAt?: string | null;
  vendorAcceptedAt?: string | null;
  cmAcceptedBy?: RedlineAcceptedByUser | null;
  vendorAcceptedBy?: RedlineAcceptedByUser | null;
  status?: RedlineAcceptanceState;
  /** True when both parties accepted — the client applies the replacement and
   *  removes the redline from the document. */
  shouldRemove?: boolean;
};

/**
 * Which dual-approval step this viewer is on for a redline:
 * - `open`: nobody has accepted — the normal pending suggestion.
 * - `awaiting-me`: the other side accepted — show an approve/reject request.
 * - `awaiting-other`: this viewer accepted — waiting on the other side.
 * - `both`: both accepted — applied / resolved.
 */
export type DualApprovalPhase = "open" | "awaiting-me" | "awaiting-other" | "both";

/** Map a bilateral-acceptance status onto the viewer's step. Observers (no
 *  side) never get an actionable request, so a one-sided accept reads
 *  `awaiting-other` for them. */
export const dualApprovalPhase = (
  accepted: RedlineAcceptance | undefined,
  mySide: RedlineResolvedHolder | undefined,
): DualApprovalPhase => {
  const status = accepted?.status ?? "pending";
  if (status === "both_accepted") return "both";
  if (status === "pending") return "open";
  const acceptedSide: RedlineResolvedHolder =
    status === "cm_accepted" ? "manager" : "vendor";
  if (!mySide) return "awaiting-other";
  return acceptedSide === mySide ? "awaiting-other" : "awaiting-me";
};

/**
 * The dual-approval phase for a viewer, driven solely by the BE-authoritative
 * bilateral `accepted` state. The BE now owns turn + dual-approval, so the FE is
 * a thin projection of it — there is no single-sided-resolution fallback to
 * second-guess. `dualApprovalPhase` returns "open" when `accepted` is absent or
 * still `pending`, so an un-acted redline reads as a normal pending suggestion.
 */
export const effectiveApprovalPhase = (input: {
  accepted?: RedlineAcceptance;
  mySide: RedlineResolvedHolder | undefined;
}): DualApprovalPhase => dualApprovalPhase(input.accepted, input.mySide);

/** The side that has already accepted (with who/when), for the one-sided
 *  states. Returns null when zero or both sides have accepted. */
export const acceptanceActor = (
  accepted: RedlineAcceptance | undefined,
): { holder: RedlineResolvedHolder; name?: string; at?: string } | null => {
  if (accepted?.status === "cm_accepted") {
    return {
      holder: "manager",
      name: accepted.cmAcceptedBy?.name ?? undefined,
      at: accepted.cmAcceptedAt ?? undefined,
    };
  }
  if (accepted?.status === "vendor_accepted") {
    return {
      holder: "vendor",
      name: accepted.vendorAcceptedBy?.name ?? undefined,
      at: accepted.vendorAcceptedAt ?? undefined,
    };
  }
  return null;
};

/** Human label for a negotiating side. */
export const redlineHolderLabel = (holder: RedlineResolvedHolder): string =>
  holder === "vendor" ? "Vendor PM" : "Contract manager";

/** Optimistically fold this viewer's acceptance into the bilateral state so the
 *  card flips immediately, before the GET refetch confirms it. */
export const withLocalAcceptance = (
  accepted: RedlineAcceptance | undefined,
  mySide: RedlineResolvedHolder,
): RedlineAcceptance => {
  const next: RedlineAcceptance = { ...accepted };
  if (mySide === "manager") next.cmAccepted = true;
  else next.vendorAccepted = true;
  const both = Boolean(next.cmAccepted) && Boolean(next.vendorAccepted);
  next.status = both
    ? "both_accepted"
    : next.cmAccepted
      ? "cm_accepted"
      : "vendor_accepted";
  next.shouldRemove = both;
  return next;
};

/** Union a viewer's optimistic acceptance with the server's authoritative
 *  state: keep a just-made local accept the BE hasn't echoed yet, and adopt the
 *  other side's accept once the BE reports it. Status/`shouldRemove` are
 *  recomputed from the merged flags; the BE's who/when identity fields win. A
 *  withdrawn (undone) acceptance must be cleared locally before merging, so it
 *  does not resurrect here. */
export const mergeAcceptance = (
  local: RedlineAcceptance | undefined,
  server: RedlineAcceptance | undefined,
): RedlineAcceptance | undefined => {
  const cm = Boolean(server?.cmAccepted) || Boolean(local?.cmAccepted);
  const vendor =
    Boolean(server?.vendorAccepted) || Boolean(local?.vendorAccepted);
  if (!cm && !vendor) return server ?? local;
  const both = cm && vendor;
  return {
    ...local,
    ...server,
    cmAccepted: cm,
    vendorAccepted: vendor,
    status: both ? "both_accepted" : cm ? "cm_accepted" : "vendor_accepted",
    shouldRemove: both,
  };
};

export type SuggestionProgress = {
  total?: number;
  pending?: number;
  addressedCount?: number;
  resolvedCount?: number;
  resolvedByManager?: number;
  resolvedByVendor?: number;
  /** Suggestions accepted by the contract manager (company side). */
  cm_accept?: number;
  /** Suggestions accepted by the vendor PM. */
  pm_accept?: number;
  /** Both-accepted total. The GET also sends `resolvedCount`; either works. */
  resolved?: number;
};

/**
 * Per-side counts for the AI Polish header. Each side's "addressed" total is
 * shown independently — who has acted on a recommendation — and "resolved" is
 * the resolved/both-accepted total. All are computed by the backend; we only
 * surface them.
 *
 * The per-side count lives in one of two counters, and which one the backend
 * populates has changed over time: older deployments filled `resolvedByManager`
 * / `resolvedByVendor` (leaving `cm_accept` / `pm_accept` at 0), while the
 * current backend fills `cm_accept` / `pm_accept` (leaving `resolvedByManager`
 * at 0). Reading a single one as primary sticks the header at 0 whenever the BE
 * populates the other — so take the MAX of the pair: whichever the BE reports
 * wins, and 0-vs-N yields N.
 */
export type ProgressCounts = {
  cmAddressed?: number;
  pmAddressed?: number;
  resolved?: number;
};

const firstNumber = (...values: Array<number | undefined>): number | undefined =>
  values.find((v) => typeof v === "number");

/** Max of the defined numbers, or undefined when none are numbers. */
const maxNumber = (...values: Array<number | undefined>): number | undefined => {
  const nums = values.filter((v): v is number => typeof v === "number");
  return nums.length > 0 ? Math.max(...nums) : undefined;
};

export const deriveProgressCounts = (
  progress?: SuggestionProgress,
): ProgressCounts => ({
  cmAddressed: maxNumber(progress?.resolvedByManager, progress?.cm_accept),
  pmAddressed: maxNumber(progress?.resolvedByVendor, progress?.pm_accept),
  resolved: firstNumber(progress?.resolvedCount, progress?.resolved),
});

export type PersistedSuggestionsResponse = {
  suggestions: PersistedSuggestion[];
  progress: SuggestionProgress;
};

type PersistedApiBody = {
  status?: number;
  message?: string;
  data?: {
    suggestions?: Array<Record<string, unknown>>;
    /** Some deployments key the persisted list `redlineAnalysis` (the same
     *  shape as the generate response, with `resolution`/`acceptance` folded
     *  in) instead of `suggestions`. Accept either. */
    redlineAnalysis?: Array<Record<string, unknown>>;
    progress?: SuggestionProgress;
  };
};

const parsePersistedBody = (body: PersistedApiBody): PersistedSuggestionsResponse => {
  const data = body?.data ?? {};
  const rows = Array.isArray(data.suggestions)
    ? data.suggestions
    : Array.isArray(data.redlineAnalysis)
      ? data.redlineAnalysis
      : undefined;
  const suggestions: PersistedSuggestion[] = rows
    ? rows
        .filter((s) => Boolean(s?.redlineId))
        .map((s) => ({
          redlineId: s.redlineId as string,
          sourceText:
            typeof s.sourceText === "string" ? s.sourceText : undefined,
          assessment: (s.assessment as string) ?? "",
          suggestion: typeof s.suggestion === "string" ? s.suggestion : "",
          acceptability: s.acceptability as AiAcceptability | undefined,
          considerations: s.considerations as AiConsiderations | undefined,
          alternativeLanguage: s.alternativeLanguage as AiAlternativeLanguage | undefined,
          solution: typeof s.solution === "string" ? s.solution : undefined,
          riskLevel: (s.riskLevel as AiRiskLevel) ?? "medium",
          replacementText: typeof s.replacementText === "string" ? s.replacementText : undefined,
          resolution: s.resolution as PersistedResolution | undefined,
          // BE sends the bilateral dual-approval state under `acceptance`;
          // older payloads used `accepted`. Read either — dropping it discards
          // the authoritative `both_accepted`/`shouldRemove` signal.
          accepted:
            ((s.acceptance ?? s.accepted) as RedlineAcceptance | null) ??
            undefined,
        }))
    : [];
  return { suggestions, progress: data.progress ?? {} };
};

/**
 * GET persisted AI redline suggestions. Returns previously-generated
 * suggestions with their resolution state and aggregate progress counts.
 * When no suggestions have been generated yet, returns an empty array.
 */
/** How often the waiting side re-fetches persisted suggestions (ms). */
const WAITING_POLL_MS = 10000;

export function usePersistedSuggestions({
  documentId,
  fileId,
  isMsa,
  pollWhileWaiting = false,
}: AiRedlineScope & { fileId?: string; pollWhileWaiting?: boolean }) {
  const role = useUserRole();
  // The GET list route requires both the contract id and the document (file) id.
  const url =
    documentId && fileId
      ? buildEndpoint({
          documentId,
          isMsa: Boolean(isMsa),
          isManager: role.isManager,
          isVendor: role.isVendor,
          isProjectManager: role.isProjectManager,
          redlineDocumentId: fileId,
        })
      : null;

  return useQuery<PersistedSuggestionsResponse>({
    queryKey: ["ai-redline-suggestions-persisted", url],
    enabled: Boolean(url),
    queryFn: async () => {
      const res = await getRequest({ url: url! });
      return parsePersistedBody(res.data as PersistedApiBody);
    },
    // Fail fast — don't retry a 4xx (e.g. a validation error) three times per
    // load/poll and hammer the endpoint.
    retry: false,
    staleTime: 30000,
    // Poll only while waiting on the other side, and only when the tab is
    // focused (refetchIntervalInBackground defaults false), so the other
    // side's edits/approvals surface without a manual refresh.
    refetchInterval: pollWhileWaiting ? WAITING_POLL_MS : false,
  });
}
