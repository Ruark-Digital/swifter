import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { useUserRole } from "@/hooks/useUserRole";
import type { RedlineSpan } from "./redlineScan";

/**
 * Per-redline analysis returned by the backend.
 * Swagger schema: RedlineAnalysisResultItem.
 */
export type AiRedlineSuggestion = {
  redlineId: string;
  /** AI assessment of the redline (what changes and why it matters). */
  assessment: string;
  /** Action recommendation for this single redline. */
  suggestion: "accept" | "reject" | "negotiate";
  /** Risk level for this single redline. */
  riskLevel: "high" | "medium" | "low";
};

/**
 * Aggregate analysis returned alongside the per-redline suggestions.
 * Swagger schema: RedlineAnalysisResult.
 */
export type AiRedlineAnalysis = {
  summary: string;
  riskLevel: "high" | "medium" | "low";
  overallSuggestion: "accept" | "reject" | "negotiate";
  suggestions: AiRedlineSuggestion[];
};

type ApiResponseBody = {
  status?: number;
  message?: string;
  data?: {
    summary?: string;
    riskLevel?: AiRedlineAnalysis["riskLevel"];
    overallSuggestion?: AiRedlineAnalysis["overallSuggestion"];
    redlineAnalysis?: Array<{
      redlineId?: string;
      assessment?: string;
      suggestion?: AiRedlineSuggestion["suggestion"];
      riskLevel?: AiRedlineSuggestion["riskLevel"];
    }>;
  };
};

export type AiRedlineScope = {
  /** Required — id of the contract or MSA contract being analysed. */
  documentId: string | undefined;
  /** Default false → /contracts/...; true → /msa-contract/... */
  isMsa?: boolean;
};

const buildEndpoint = ({
  documentId,
  isMsa,
  isManager,
  isApprover,
  isVendor,
  isProjectManager,
  isViewOnly,
}: {
  documentId: string;
  isMsa: boolean;
  isManager: boolean;
  isApprover: boolean;
  isVendor: boolean;
  isProjectManager: boolean;
  isViewOnly: boolean;
}): string | null => {
  const resource = isMsa ? "msa-contract" : "contracts";
  // axios baseURL is /api/v1/dev — swagger paths live under /contract.
  const prefix = "/contract";
  if (isManager) return `${prefix}/manager/${resource}/${documentId}/ai/redline-suggestions`;
  if (isApprover) return `${prefix}/approver/${resource}/${documentId}/ai/redline-suggestions`;
  if (isVendor || isProjectManager)
    return `${prefix}/vendor/${resource}/${documentId}/ai/redline-suggestions`;
  if (isViewOnly) return `${prefix}/user/${resource}/${documentId}/ai/redline-suggestions`;
  return null;
};

/**
 * Sends every redlined span to the backend (which proxies to an LLM) and
 * returns one assessment + accept/reject/negotiate recommendation per
 * `redlineId`, plus an aggregate risk verdict for the document.
 *
 * Swagger endpoints (all share the same request/response shape):
 *   POST /manager|approver|vendor|user/contracts/{contractId}/ai/redline-suggestions
 *   POST /manager|approver|vendor|user/msa-contract/{contractId}/ai/redline-suggestions
 *
 * Body:     { redlines: RedlineSpan[] }
 * 200 data: { summary, riskLevel, overallSuggestion, redlineAnalysis: [...] }
 */
export function useAiRedlineSuggestions({ documentId, isMsa }: AiRedlineScope) {
  const role = useUserRole();
  const url = documentId
    ? buildEndpoint({
        documentId,
        isMsa: Boolean(isMsa),
        isManager: role.isManager,
        isApprover: role.isApprover,
        isVendor: role.isVendor,
        isProjectManager: role.isProjectManager,
        isViewOnly: role.isViewOnly,
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
      const res = await postRequest({ url, payload: { redlines } });
      const body = res.data as ApiResponseBody;
      const data = body?.data ?? {};
      const suggestions: AiRedlineSuggestion[] = Array.isArray(
        data.redlineAnalysis,
      )
        ? data.redlineAnalysis
            .filter((s): s is Required<typeof s> => Boolean(s?.redlineId))
            .map((s) => ({
              redlineId: s.redlineId as string,
              assessment: s.assessment ?? "",
              suggestion: (s.suggestion as AiRedlineSuggestion["suggestion"]) ?? "negotiate",
              riskLevel: (s.riskLevel as AiRedlineSuggestion["riskLevel"]) ?? "medium",
            }))
        : [];
      return {
        summary: data.summary ?? "",
        riskLevel: (data.riskLevel as AiRedlineAnalysis["riskLevel"]) ?? "low",
        overallSuggestion:
          (data.overallSuggestion as AiRedlineAnalysis["overallSuggestion"]) ?? "negotiate",
        suggestions,
      };
    },
  });
}
