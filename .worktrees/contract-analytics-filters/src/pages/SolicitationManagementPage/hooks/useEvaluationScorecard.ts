import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";

interface EvaluationCriteria {
  id: string;
  title: string;
  description: string;
  type: string;
  score: number | string;
  weight: number;
  comment?: string;
  group: string;
  newScore: { score: number, weight: number },
  totalVendorScore: number,
  // Optional vendor fields based on API response
  vendorId?: string;
  vendorName?: string;
}

interface EvaluatorDetails {
  name: string;
  email: string;
  submission: string;
  status: string;
  score: number | string;
}

interface EvaluationScorecardData {
  evaluator: EvaluatorDetails;
  criteria: EvaluationCriteria[];
  totalScore: number;
  criteriaWeightSummtion: number;
  maxScore: number;
}

interface EvaluationScorecardResponse {
  message: string;
  data: EvaluationScorecardData;
}

export const useEvaluationScorecard = (
  solicitationId: string,
  evaluatorId: string,
  enabled: boolean = true
) => {
  return useQuery<EvaluationScorecardResponse>({
    queryKey: ["evaluation-scorecard", solicitationId, evaluatorId],
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/solicitations/${solicitationId}/evaluator-score-card/${evaluatorId}`,
      });
      // Extract the data from the axios response
      return response.data as EvaluationScorecardResponse;
    },
    enabled: enabled && !!solicitationId && !!evaluatorId,
  });
};

export type { EvaluationCriteria, EvaluatorDetails, EvaluationScorecardData };