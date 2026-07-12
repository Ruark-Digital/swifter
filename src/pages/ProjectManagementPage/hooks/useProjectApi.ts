import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, patchRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { ApiResponse, ApiResponseError } from "@/types";

type ProjectFile = {
  name: string;
  url: string;
  type: string;
  size: number;
};

type Project = {
  _id: string;
  company: string;
  creator: {
    _id: string;
    name?: string;
    email: string;
  };
  name: string;
  category: string;
  description: string;
  businessDivision?: string;
  startDate?: string;
  endDate?: string;
  contract: Contract[];
  files?: ProjectFile[];
  budget: number;
  status: "active" | "completed" | "cancelled";
  allowMultiple?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type UpdateProjectPayload = {
  name?: string;
  category?: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  allowMultiple?: boolean;
  status?: "active" | "completed" | "cancelled" | "pending";
  files?: ProjectFile[];
  businessDivision?: string;
};

type Contract = {
  _id: string;
  company: string;
  project: string;
  vendor: { _id?: string; name?: string } | null;
  creator: { _id?: string; name?: string } | null;
  title: string;
  contractId?: string;
  contractType: "hourly" | "fixed" | "milestone";
  currency?: string;
  ratePerHour?: number;
  totalAmount?: number;
  contractValue?: number;
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

export const useUpdateProject = (projectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Project>, ApiResponseError, UpdateProjectPayload>({
    mutationFn: async (payload) =>
      await patchRequest({
        url: `/contract/manager/projects/${projectId}`,
        payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-list"] });
      queryClient.invalidateQueries({ queryKey: ["projects-list"] });
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-contracts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects-stats"] });
    },
  });
};

export type { Project, ProjectFile, Contract, UpdateProjectPayload };
