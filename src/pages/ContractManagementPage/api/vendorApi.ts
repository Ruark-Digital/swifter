import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ContractDetail } from "@/types";
import { AxiosRequestConfig } from "axios";
import {
  ContractChangeDTO,
  ContractInvoiceDTO,
  ContractRfiDTO,
  ManagerListRfisQuery,
} from "./contractManagerApi";

type GetParams = { url: string; config?: AxiosRequestConfig };

export const createVendorApi = (
  client = {
    get: (params: GetParams) => getRequest(params),
  },
) => ({
  getContract: async (contractId: string) => {
    const res = await client.get({
      url: `contract/vendor/contracts/${contractId}`,
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
      type: "request" | "order" | "proposal";
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
  listRfis: async (
    contractId: string,
    query?: ManagerListRfisQuery,
  ) => {
    const res = await client.get({
      url: `/vendor/contracts/${contractId}/rfi`,
      config: query ? { params: query } : undefined,
    });
    return res as ApiResponse<{
      contractRfis?: any[];
      total?: number;
      page?: number;
      skip?: number;
    }>;
  },
  createRfi: async (dataId: string, payload: ContractRfiDTO) => {
    const res = await postRequest({
      url: `/vendor/contracts/${dataId}/rfi`,
      payload,
    });
    return res as ApiResponse<ContractRfiDTO>;
  },
  getRfiDetail: async (contractId: string, rfiId: string) => {
    const res = await client.get({
      url: `/contract/vendor/contracts/${contractId}/rfi/${rfiId}`,
    });
    return res as ApiResponse<ContractRfiDTO>;
  },
  createLem: async (
    contractId: string,
    payload: {
      title: string;
      description: string;
      amount: number;
      files: { name: string; url: string; type: string; size: number }[];
    },
  ) => {
    const res = await postRequest({
      url: `/contract/vendor/contracts/${contractId}/lems`,
      payload,
    });
    return res as ApiResponse<any>;
  },
  createInvoice: async (
    contractId: string,
    payload: {
      title: string;
      description: string;
      type: "progress draw" | "monthly payment" | "milestone payment" | "holdback";
      taxCode: "HST" | "GST" | "PST/QST" | "Others";
      status: "active" | "draft";
      fileType: "manual" | "file";
      taxValue?: number;
      amount?: number;
      files?: { name: string; url: string; type: string; size: string }[];
      items?: Array<{
        component?: string;
        description?: string;
        quantity?: number;
        unitOfmeasurement?: string;
        unitPrice?: number;
      }>;
    },
  ) => {
    const res = await postRequest({
      url: `/contract/vendor/contracts/${contractId}/invoice`,
      payload,
    });
    return res as ApiResponse<ContractInvoiceDTO>;
  },
  getInvoiceDetail: async (contractId: string, invoiceId: string) => {
    const res = await client.get({
      url: `/contract/vendor/contracts/${contractId}/invoice/${invoiceId}`,
    });
    return res as ApiResponse<ContractInvoiceDTO>;
  },
  listPersonnel: async (contractId: string) => {
    const res = await client.get({
      url: `/contract/vendor/contracts/${contractId}/personnel`,
    });
    return res;
  },
});

export const vendorApi = createVendorApi();
