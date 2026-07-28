import { getRequest, postRequest, putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ContractDetail } from "@/types";
import { AxiosRequestConfig } from "axios";
import {
  ContractChangeDTO,
  ContractCommentDTO,
  ContractInvoiceDTO,
  ContractRfiDTO,
  ContractRfiResponseDTO,
  ContractChangeCommentDTO,
  ManagerListRfisQuery,
} from "./contractManagerApi";

type VendorContractPersonnelDTO = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Array<{ name?: string }> | { name?: string } | string;
  phone?: string;
};

type GetParams = { url: string; config?: AxiosRequestConfig };
type PostParams = { url: string; payload: unknown; config?: AxiosRequestConfig };
type VendorApiClient = {
  get: (params: GetParams) => Promise<{ data: unknown }>;
  post?: (params: PostParams) => Promise<{ data: unknown }>;
};

export const createVendorApi = (
  client: VendorApiClient = {
    get: (params: GetParams) => getRequest(params),
    post: (params: PostParams) => postRequest(params),
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
      url: `/contract/vendor/contracts/${contractId}/changes/stats`,
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
        ? `/contract/vendor/contracts/${contractId}/changes?${qs.toString()}`
        : `/contract/vendor/contracts/${contractId}/changes`;
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
    const post = client.post ?? ((params: PostParams) => postRequest(params));
    const res = await post({
      url: `/contract/vendor/contracts/${contractId}/changes`,
      payload,
    });
    return res as ApiResponse<any>;
  },
  updateChange: async (
    contractId: string,
    changeId: string,
    payload: {
      title: string;
      description: string;
      type: "request" | "order" | "proposal";
      proposalCategory?: string;
      urgency?: "low" | "medium" | "high";
      files?: { name: string; url: string; type: string; size: number }[];
    },
  ) => {
    const res = await putRequest({
      url: `/contract/vendor/contracts/${contractId}/changes/${changeId}`,
      payload,
    });
    return res as ApiResponse<any>;
  },
  createMsaChange: async (
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
    const post = client.post ?? ((params: PostParams) => postRequest(params));
    const res = await post({
      url: `/contract/vendor/msa-contracts/${contractId}/changes`,
      payload,
    });
    return res as ApiResponse<any>;
  },
  listChangeComments: async (contractId: string, changeId: string) => {
    const res = await client.get({
      url: `/contract/vendor/contracts/${contractId}/changes/${changeId}/comment`,
    });
    return res as ApiResponse<{ data?: ContractChangeCommentDTO[] }>;
  },
  addChangeComment: async (
    contractId: string,
    changeId: string,
    payload: { content: string },
  ) => {
    const post = client.post ?? ((params: PostParams) => postRequest(params));
    const res = await post({
      url: `/contract/vendor/contracts/${contractId}/changes/${changeId}/comment`,
      payload,
    });
    return res as ApiResponse<ContractChangeCommentDTO>;
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
  listRfiComments: async (contractId: string, rfiId: string) => {
    const res = await client.get({
      url: `/contract/vendor/contracts/${contractId}/rfi/${rfiId}/comment`,
    });
    return (res as { data?: unknown })?.data as {
      message?: string;
      data?: { data?: ContractCommentDTO[]; page?: number; limit?: number };
    };
  },
  addRfiComment: async (
    contractId: string,
    rfiId: string,
    payload: ContractChangeCommentDTO,
  ) => {
    const post = client.post ?? ((params: PostParams) => postRequest(params));
    const res = await post({
      url: `/contract/vendor/contracts/${contractId}/rfi/${rfiId}/comment`,
      payload,
    });
    return (res as { data?: unknown })?.data as {
      message?: string;
      data?: ContractCommentDTO;
    };
  },
  createRfiResponse: async (
    contractId: string,
    rfiId: string,
    payload: ContractRfiResponseDTO,
  ) => {
    const post = client.post ?? ((params: PostParams) => postRequest(params));
    const res = await post({
      url: `/contract/vendor/contracts/${contractId}/rfi/${rfiId}/response`,
      payload,
    });
    return (res as { data?: unknown })?.data as {
      message?: string;
      data?: ContractRfiDTO;
    };
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
  updateLem: async (
    contractId: string,
    lemId: string,
    payload: {
      title: string;
      description: string;
      amount: number;
      files: { name: string; url: string; type: string; size: number }[];
    },
  ) => {
    const res = await putRequest({
      url: `/contract/vendor/contracts/${contractId}/lems/${lemId}`,
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
  updateInvoice: async (
    contractId: string,
    invoiceId: string,
    payload: Partial<{
      title: string;
      description: string;
      type: "progress draw" | "monthly payment" | "milestone payment" | "holdback";
      taxCode: "HST" | "GST" | "PST/QST" | "Others";
      status: "active" | "draft";
      fileType: "manual" | "file";
      taxValue: number;
      amount: number;
      files: { name: string; url: string; type: string; size: string }[];
      items: Array<{
        component?: string;
        description?: string;
        quantity?: number;
        unitOfmeasurement?: string;
        unitPrice?: number;
      }>;
    }>,
  ) => {
    const res = await putRequest({
      url: `/contract/vendor/contracts/${contractId}/invoice/${invoiceId}`,
      payload,
    });
    return res as ApiResponse<ContractInvoiceDTO>;
  },
  listPersonnel: async (contractId: string) => {
    const res = await client.get({
      url: `/contract/vendor/contracts/${contractId}/personnel`,
    });
    return res as ApiResponse<VendorContractPersonnelDTO[]>;
  },
  approveContract: async (
    contractId: string,
    payload: { action: "approved" | "rejected"; comment?: string }
  ) => {
    const res = await postRequest({
      url: `/contract/vendor/contracts/${contractId}/approve`,
      payload,
    });
    return res as ApiResponse<any>;
  },
  requestContractTakeOver: async (contractId: string, projectManagerId: string) => {
    const post = client.post ?? ((params: PostParams) => postRequest(params));
    const res = await post({
      url: `/contract/vendor/contracts/${contractId}/project-managers/${projectManagerId}/assign`,
      payload: undefined,
    });
    return res as ApiResponse<any>;
  },
});

export const vendorApi = createVendorApi();
