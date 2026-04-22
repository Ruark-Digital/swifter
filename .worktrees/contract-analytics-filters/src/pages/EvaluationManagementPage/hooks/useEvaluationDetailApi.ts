import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest, deleteRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { Solicitation } from "@/pages/SolicitationManagementPage/SolicitationDetailPage";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";

// API Types
type EvaluationDetail = {
  evalId: string;
  _id: string;
  solicitation: {
    _id: string;
    name: string;
    type: string;
  };
  status: "draft" | "active" | "completed" | "pending";
  solicitationDetails: Solicitation;
  startDate: string;
  endDate: string;
  timezone: string;
  owner: boolean;
  evaluators: {
    groupId: string;
    groupName: string;
    evaluators: {
      name: string;
      email: string;
      _id: string;
      criteriaCount: number;
      status: string | null;
    }[];
  }[];
  evaluatorCount: number;
  groups: number;
  criteriaCount: number;
  documents: number;
  totalEvaluatorsInGroups: number;
  vendorCount: number;
  requiredDocuments: {
    title: string;
    type: string;
    groupName: string;
    vendor: number;
    vendorCount: number;
  }[];
  criterias: {
    _id: string;
    title: string;
    description: string;
    evaluationGroup: string;
    progress: number | null;
    criteria: {
      pass_fail: string;
      weight: number;
      status: string;
    };
    __v: number;
    createdAt: string;
    updatedAt: string;
  }[];
  evaluationGroups: {
    groupId: string;
    groupName: string;
    status: "Release" | "Withhold";
    evaluators: {
      _id: string;
      name: string;
    }[];
    criteriaDetails: {
      title: string;
      criteria: {
        pass_fail: string;
        weight: number;
        status: string;
      };
    }[];
    documentTitles: string[];
    averageProgress: number | null;
  }[];
};

type EvaluatorInGroup = {
  _id: string;
  name: string;
  email: string;
  progress: number | null;
  status: string | null;
};

type EvaluatorGroup = {
  groupId: string;
  groupName: string;
  evaluators: EvaluatorInGroup[];
  criteriaCount: number;
  totalEvaluators: number;
  groupProgress: number | null;
  completedEvaluators: number;
};

export interface EvaluatorResponse {
  groups:     DataGroup[];
  evaluation: Evaluation;
}

export interface Evaluation {
  summary: Summary;
  id:      string;
}

export interface Summary {
  totalEvaluators:       number;
  averageProgress:       number;
  totalRequiredScorings: number;
  completedScorings:     number;
}

export interface DataGroup {
  id:                string;
  name:              string;
  email:             string;
  progress:          number;
  status:            string;
  totalScorings:     number;
  submittedScorings: number;
  groups:            GroupGroup[];
}

export interface GroupGroup {
  groupId:           string;
  groupName:         string;
  groupStatus:       string;
  progress:          number;
  status:            string;
  totalScorings:     number;
  submittedScorings: number;
  submittedAt?:      Date;
}


type Criteria = {
  _id: string;
  criteria: string;
  description: string;
  passFail: "Pass" | "Fail" | "-";
  weight: number | "-";
  evaluationGroup: string;
};

// Evaluation Groups Types
type EvaluationGroupApi = {
  groupName: string;
  evaluatorNames: string[];
  documentTitles: string[];
  criteriaTitles: string[];
  scoring: any[];
};

// API Hooks
export const useEvaluationDetail = (evaluationId: string) => {
  return useQuery<ApiResponse<EvaluationDetail>, ApiResponseError>({
    queryKey: useUserQueryKey(["evaluation-detail", evaluationId]),
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${evaluationId}`,
      });
      return response;
    },
    enabled: !!evaluationId,
  });
};

export const useEvaluationEvaluators = (evaluationId: string) => {
  return useQuery<ApiResponse<EvaluatorResponse>, ApiResponseError>({
    queryKey: useUserQueryKey(["evaluation-evaluators", evaluationId]),
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${evaluationId}/evaluators`,
      });
      return response;
    },
    enabled: !!evaluationId,
  });
};

export const useEvaluationCriteria = (evaluationId: string) => {
  return useQuery<Criteria[]>({
    queryKey: useUserQueryKey(["evaluation-criteria", evaluationId]),
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${evaluationId}/criteria`,
      });
      return response.data?.data || [];
    },
    enabled: !!evaluationId,
  });
};

export const useEvaluationGroups = (evaluationId: string) => {
  return useQuery<ApiResponse<EvaluationGroupApi[]>, ApiResponseError>({
    queryKey: useUserQueryKey(["evaluation-groups", evaluationId]),
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${evaluationId}/groups`,
      });
      return response;
    },
    enabled: !!evaluationId,
  });
};

// Bid Comparison types based on API schema
export type BidComparisonItem = {
  proposalId: string;
  vendorName: string | null;
  vendorEmail: string | null;
  total: number | null;
  score: number | null;
  submission: string | null; // ISO date string
  rank: number | null;
};

export const useEvaluationBidComparison = (evaluationId: string) => {
  return useQuery<ApiResponse<BidComparisonItem[]>, ApiResponseError>({
    queryKey: useUserQueryKey(["evaluation-bid-comparison", evaluationId]),
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/${evaluationId}/bid-comparison`,
      });
      return response;
    },
    enabled: !!evaluationId,
  });
};

// Release and Withhold API hooks
export const useReleaseEvaluationGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { evaluationGroupId: string; evaluationId: string }
  >({
    mutationFn: async ({ evaluationGroupId, evaluationId }) => {
      const response = await putRequest({
        url: `/procurement/evaluations/${evaluationId}/evaluation-group/${evaluationGroupId}/status/release`,
        payload: {},
      });
      return response;
    },
    onSuccess: (_, { evaluationId }) => {
      // Refetch evaluation details to get updated status
      queryClient.invalidateQueries({
        queryKey: ["evaluation-detail", evaluationId],
      });
    },
  });
};

export const useWithholdEvaluationGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { evaluationGroupId: string; evaluationId: string }
  >({
    mutationFn: async ({ evaluationGroupId, evaluationId }) => {
      const response = await putRequest({
        url: `/procurement/evaluations/${evaluationId}/evaluation-group/${evaluationGroupId}/status/withhold`,
        payload: {},
      });
      return response;
    },
    onSuccess: (_, { evaluationId }) => {
      // Refetch evaluation details to get updated status
      queryClient.invalidateQueries({
        queryKey: ["evaluation-detail", evaluationId],
      });
    },
  });
};

// Delete Evaluation Group hook
export const useDeleteEvaluationGroup = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { evaluationId: string; groupId: string }
  >({
    mutationFn: async ({ evaluationId, groupId }) => {
      const response = await deleteRequest({
        url: `/procurement/evaluations/${evaluationId}/groups/${groupId}`,
      });
      return response;
    },
    onSuccess: (_, { evaluationId }) => {
      // Refetch evaluation details to reflect deletion
      queryClient.invalidateQueries({
        queryKey: ["evaluation-detail", evaluationId],
      });
    },
  });
};

export const useDeleteEvaluationCriteria = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ApiResponse<any>,
    ApiResponseError,
    { evaluationId: string; criteriaId: string }
  >({
    mutationFn: async ({ evaluationId, criteriaId }) => {
      const response = await deleteRequest({
        url: `/procurement/evaluations/${evaluationId}/criteria/${criteriaId}`,
      });
      return response;
    },
    onSuccess: (_, { evaluationId }) => {
      // Refetch evaluation details and criteria lists to reflect deletion
      queryClient.invalidateQueries({ queryKey: ["evaluation-detail", evaluationId] });
      queryClient.invalidateQueries({ queryKey: ["evaluation-criteria", evaluationId] });
    },
  });
};

// Export types for use in components
export type {
  EvaluationDetail,
  EvaluatorInGroup,
  EvaluatorGroup,
  // EvaluatorResponse,
  Criteria,
  EvaluationGroupApi,
};
