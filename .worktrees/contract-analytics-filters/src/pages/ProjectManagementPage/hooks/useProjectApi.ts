import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, patchRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { ApiResponse, ApiResponseError } from "@/types";

type Project = {
  _id: string;
  company: string;
  creator: {
    _id: string;
    email: string;
  };
  name: string;
  category: string;
  description: string;
  startDate?: string;
  endDate?: string;
  contract: Contract[];
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  budget: number;
  status: "active" | "completed" | "cancelled";
  allowMultiple?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type Contract = {
  _id: string;
  company: string;
  project: string;
  vendor: string;
  creator: string;
  title: string;
  contractType: "hourly" | "fixed" | "milestone";
  currency?: string;
  ratePerHour?: number;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
  status: "draft" | "pending_approval" | "active" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
};

export const useProjectDetail = (projectId?: string) => {
  return useQuery<ApiResponse<Project>, ApiResponseError>({
    queryKey: useUserQueryKey(["project-detail", projectId]),
    queryFn: async () =>
      await getRequest({ url: `/contract/manager/projects/${projectId}` }),
    enabled: !!projectId,
  });
};

export const useProjectContracts = (projectId?: string) => {
  return useQuery<ApiResponse<Contract[]>, ApiResponseError>({
    queryKey: useUserQueryKey(["project-contracts", projectId]),
    queryFn: async () =>
      await getRequest({ url: `/contract/manager/projects/${projectId}/contracts` }),
    enabled: !!projectId,
  });
};

export const useCompleteProject = (projectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Project>, ApiResponseError, void>({
    mutationFn: async () =>
      await patchRequest({
        url: `/contract/manager/projects/${projectId}/complete`,
        payload: {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["project-list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-detail", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-contracts", projectId],
      });
    },
  });
};

export type { Project, Contract };
