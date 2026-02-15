import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ContractDetail, ApiResponse } from "@/types";
import { AxiosRequestConfig } from "axios";

export interface ApprovalActionDTO {
  action: "approved" | "rejected";
  comment?: string;
}

type GetParams = { url: string; config?: AxiosRequestConfig };
type PostParams = { url: string; payload: unknown; config?: AxiosRequestConfig };

export const createApproverApi = (
  client = {
    get: (params: GetParams) => getRequest(params),
    post: (params: PostParams) => postRequest(params),
  }
) => ({
  getContract: async (contractId: string) => {
    return client.get({
      url: `/approver/contract/${contractId}`,
    }) as Promise<ApiResponse<ContractDetail>>;
  },

  getApproveStatus: async (contractId: string) => {
    return client.get({
      url: `/approver/contract/${contractId}/approve/status`,
    }) as Promise<ApiResponse<{ status: boolean }>>;
  },

  approveContract: async (contractId: string, payload: ApprovalActionDTO) => {
    return client.post({
      url: `/approver/contract/${contractId}/approve`,
      payload,
    }) as Promise<ApiResponse<ContractDetail>>;
  },
});

export const approverApi = createApproverApi();
