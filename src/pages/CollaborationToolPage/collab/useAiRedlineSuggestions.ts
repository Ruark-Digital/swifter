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
}: {
  documentId: string;
  isMsa: boolean;
  isManager: boolean;
  isVendor: boolean;
  isProjectManager: boolean;
}): string | null => {
  const resource = isMsa ? "msa-contracts" : "contracts";
  // axios baseURL is /api/v1/dev — swagger paths live under /contract.
  const prefix = "/contract";
  if (isManager) return `${prefix}/manager/${resource}/${documentId}/ai/redline-suggestions`;
  if (isVendor || isProjectManager)
    return `${prefix}/vendor/${resource}/${documentId}/ai/redline-suggestions`;
  return null;
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
 * Body:     { redlines: RedlineSpan[] }  (≤ BATCH_SIZE spans per request)
 * 200 data: { summary, riskLevel, overallSuggestion, redlineAnalysis: [...] }
 */
export function useAiRedlineSuggestions({ documentId, isMsa }: AiRedlineScope) {
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
    mutationKey: ["ai-redline-suggestions", url],
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
      // mutation (preserving the panel's error/Retry behaviour).
      const parts: AiRedlineAnalysis[] = [];
      for (const batch of chunkRedlines(redlines, BATCH_SIZE)) {
        const res = await postRequest({ url, payload: { redlines: batch } });
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
};

export type PersistedSuggestion = AiRedlineSuggestion & {
  resolution?: PersistedResolution;
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
 * shown independently — who has accepted a recommendation — and "resolved" is
 * the both-accepted total. All three are computed by the backend
 * (`cm_accept` / `pm_accept` / `resolved`); we only surface them.
 */
export type ProgressCounts = {
  cmAddressed?: number;
  pmAddressed?: number;
  resolved?: number;
};

export const deriveProgressCounts = (
  progress?: SuggestionProgress,
): ProgressCounts => ({
  cmAddressed:
    typeof progress?.cm_accept === "number" ? progress.cm_accept : undefined,
  pmAddressed:
    typeof progress?.pm_accept === "number" ? progress.pm_accept : undefined,
  resolved:
    typeof progress?.resolvedCount === "number"
      ? progress.resolvedCount
      : typeof progress?.resolved === "number"
        ? progress.resolved
        : undefined,
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
    progress?: SuggestionProgress;
  };
};

const parsePersistedBody = (body: PersistedApiBody): PersistedSuggestionsResponse => {
  const data = body?.data ?? {};
  const suggestions: PersistedSuggestion[] = Array.isArray(data.suggestions)
    ? data.suggestions
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
        }))
    : [];
  return { suggestions, progress: data.progress ?? {} };
};

/**
 * GET persisted AI redline suggestions. Returns previously-generated
 * suggestions with their resolution state and aggregate progress counts.
 * When no suggestions have been generated yet, returns an empty array.
 */
export function usePersistedSuggestions({ documentId, isMsa }: AiRedlineScope) {
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

  return useQuery<PersistedSuggestionsResponse>({
    queryKey: ["ai-redline-suggestions-persisted", url],
    enabled: Boolean(url),
    queryFn: async () => {
      const res = await getRequest({ url: url! });
      return parsePersistedBody(res.data as PersistedApiBody);
    },
    staleTime: 30000,
  });
}
