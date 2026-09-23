import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getRequest, patchRequest, postRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { ApiResponse, ApiResponseError } from "@/types";

export type ProjectExportType = "pdf" | "docx";

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
  /** Sum of approved contract invoice amounts for all contracts linked to this project. */
  totalSpend?: number;
  /** Manually entered Estimated At Completion value; `null`/absent until first entered via the EAC endpoint. */
  eac?: number | null;
  /** ISO date-time the EAC value was last manually updated. */
  lastEacUpdate?: string;
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

export type ProjectContractsQuery = {
  title?: string;
  /** `yyyy/MM/dd-yyyy/MM/dd` range. */
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
};

/** Paginated payload of `/projects/:id/contracts`. Older payloads sent a
 *  plain array, which callers still tolerate. */
export type ProjectContractsPage = {
  contracts?: Contract[];
  totalContracts?: number;
  page?: number;
  limit?: number;
};

export const useProjectContracts = (
  projectId?: string,
  query?: ProjectContractsQuery
) => {
  return useQuery<ApiResponse<ProjectContractsPage | Contract[]>, ApiResponseError>({
    queryKey: useUserQueryKey(["project-contracts", projectId, query]),
    queryFn: async () =>
      await getRequest({
        url: `/contract/manager/projects/${projectId}/contracts`,
        config: { params: query },
      }),
    enabled: !!projectId,
    // Keep the current rows on screen while the next page / filter loads.
    placeholderData: keepPreviousData,
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

export const useUpdateProjectEac = (projectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<Project>, ApiResponseError, { eac: number }>({
    mutationFn: async (payload) =>
      await patchRequest({
        url: `/contract/manager/projects/${projectId}/eac`,
        payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-detail", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects-list"] });
      queryClient.invalidateQueries({ queryKey: ["projects-stats"] });
    },
  });
};

/**
 * QA #294 — export a single project as a PDF or Word document. The BE endpoint
 * `POST /manager/projects/{projectId}/export` streams a binary file
 * (PDF / DOCX) containing the project details and a linked-contracts summary.
 * Returns the raw Blob so the caller can name and trigger the download.
 */
export const useExportProject = (projectId?: string) => {
  return useMutation<Blob, ApiResponseError, ProjectExportType>({
    mutationFn: async (exportType) => {
      const res = await postRequest({
        url: `/contract/manager/projects/${projectId}/export`,
        payload: { exportType },
        config: { responseType: "blob" },
      });
      return res.data as Blob;
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
