import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest, patchRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";

export type ProjectApi = {
  _id: string;
  company: string;
  creator?:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
      };
  name: string;
  category: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  /** Sum of approved contract invoice amounts for all contracts linked to this project. */
  totalSpend?: number;
  /** Estimated At Completion — project budget plus sum of approved change order values. */
  eac?: number;
  status: "active" | "completed" | "cancelled";
  allowMultiple: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectsListResponse = {
  status: number;
  message: string;
  data: ProjectApi[];
};

export type ProjectStats = {
  all: number;
  active: number;
  completed: number;
  cancelled: number;
};

export type CreateProjectInput = {
  name: string;
  category: string;
  description?: string;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  budget: number;
  allowMultiple: boolean;
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  businessDivision?: string;
};

export const useProjectsList = (params?: {
  name?: string;
  date?: string;
  status?: "active" | "completed" | "cancelled";
  limit?: number;
  page?: number;
}) => {
  return useQuery<ProjectsListResponse>({
    queryKey: useUserQueryKey(["projects-list", params]),
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params?.name) search.append("name", params.name);
      if (params?.date) search.append("date", params.date);
      if (params?.status) search.append("status", params.status);
      if (params?.limit) search.append("limit", String(params.limit));
      if (params?.page) search.append("page", String(params.page));

      const res = await getRequest({ url: `/contract/manager/projects?${search.toString()}` });
      return res.data;
    },
    staleTime: 60_000,
  });
};

export const useProjectsStats = () => {
  return useQuery<{ status: number; message: string; data: ProjectStats }>({
    queryKey: useUserQueryKey(["projects-stats"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/projects/stats" });
      return res.data;
    },
    staleTime: 60_000,
  });
};

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProjectInput) => {
      const res = await postRequest({ url: "/contract/manager/projects", payload });
      return res.data as { status: number; message: string; data: ProjectApi };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects-list"] });
      qc.invalidateQueries({ queryKey: ["projects-stats"] });
    },
  });
};

export const useCompleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await patchRequest({ url: `/contract/manager/projects/${projectId}/complete` });
      return res.data as { status: number; message: string; data: ProjectApi };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects-list"] });
    },
  });
};
