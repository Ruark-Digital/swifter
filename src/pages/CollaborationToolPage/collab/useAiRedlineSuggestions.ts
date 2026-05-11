import { useMutation } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import type { RedlineSpan } from "./redlineScan";

export type AiRedlineSuggestion = {
  redlineId: string;
  suggestion: string;
  rationale?: string;
};

type ApiResponse = {
  data?: { suggestions?: AiRedlineSuggestion[] };
  suggestions?: AiRedlineSuggestion[];
};

/**
 * Sends every redlined span to the backend (which proxies to Claude / OpenAI /
 * whatever model the backend picks) and returns one professional rephrase per
 * `redlineId`.
 *
 * Expected backend endpoint:
 *   POST /contracts/:contractId/ai/redline-suggestions
 *   body: { redlines: RedlineSpan[] }
 *   200:  { data: { suggestions: AiRedlineSuggestion[] } }
 */
export function useAiRedlineSuggestions(contractId: string | undefined) {
  return useMutation<AiRedlineSuggestion[], unknown, RedlineSpan[]>({
    mutationKey: ["ai-redline-suggestions", contractId],
    mutationFn: async (redlines) => {
      if (!contractId) return [];
      const res = await postRequest({
        url: `/contracts/${contractId}/ai/redline-suggestions`,
        payload: { redlines },
      });
      const body = res.data as ApiResponse;
      return body?.data?.suggestions ?? body?.suggestions ?? [];
    },
  });
}
