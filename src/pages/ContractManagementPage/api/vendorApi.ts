import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ContractDetail } from "@/types";
import { AxiosRequestConfig } from "axios";
import { ContractChangeDTO } from "./contractManagerApi";

type GetParams = { url: string; config?: AxiosRequestConfig };

export const createVendorApi = (
  client = {
    get: (params: GetParams) => getRequest(params),
  },
) => ({
  getContract: async (contractId: string) => {
    const res = await client.get({
      url: `/vendor/contract/${contractId}`,
    });
    return res as ApiResponse<ContractDetail>;
  },
  getChangeStats: async (contractId: string) => {
    const res = await client.get({
      url: `/vendor/contracts/${contractId}/change/stats`,
    });
    return res as ApiResponse<{
      all: number;
      request: number;
      order: number;
      directive: number;
      proposal: number;
    }>;
  },
  listChanges: async (
    contractId: string,
    query?: { title?: string; type?: string; page?: number; limit?: number },
  ) => {
    const qs = new URLSearchParams();
    if (query?.title) qs.set("title", query.title);
    if (query?.type) qs.set("type", query.type);
    if (query?.page) qs.set("page", String(query.page));
    if (query?.limit) qs.set("limit", String(query.limit));
    const url =
      qs.toString().length > 0
        ? `/vendor/contracts/${contractId}/change?${qs.toString()}`
        : `/vendor/contracts/${contractId}/change`;
    const res = await client.get({ url });
    return res as ApiResponse<{ changes?: ContractChangeDTO[]; total?: number }>;
  },
  createChange: async (
    contractId: string,
    payload: {
      title: string;
      description: string;
      type: "request" | "directive" | "proposal";
      proposalCategory?: string;
      urgency?: "low" | "medium" | "high";
      files?: { name: string; url: string; type: string; size: number }[];
    },
  ) => {
    const res = await postRequest({
      url: `/vendor/contracts/${contractId}/change`,
      payload,
    });
    return res as ApiResponse<any>;
  },
});

export const vendorApi = createVendorApi();
