import { getRequest, postRequest } from "@/lib/axiosInstance";
import { ContractDetail, ApiResponse } from "@/types";
import { AxiosRequestConfig } from "axios";
import type {
  ContractNcrStatsDTO,
  ContractNcrSummary,
  ManagerListNcrsQuery,
  ContractRfiDTO,
  ManagerListRfisQuery,
} from "./contractManagerApi";
import type {
  ContractChangeCommentDTO,
  ContractCommentDTO,
  ContractChangeReplyDTO,
  ContractChangeDTO,
  ContractChangeStatsDTO,
  ContractInvoiceStatsDTO,
  ContractInvoiceDTO,
  ManagerListInvoicesQuery,
  ContractClaimStatsDTO,
  ContractClaimDTO,
  ManagerListClaimsQuery,
} from "./contractManagerApi";

export interface ApprovalActionDTO {
  action: "approved" | "rejected";
  comment?: string;
}

type GetParams = { url: string; config?: AxiosRequestConfig };
type PostParams = { url: string; payload: unknown; config?: AxiosRequestConfig };

type ContractNcrCreateDTO = {
  title: string;
  description: string;
  responders?: string[];
  files?: Array<{
    name: string;
    url: string;
    type: string;
    size: string;
  }>;
};

export const createApproverApi = (
  client = {
    get: (params: GetParams) => getRequest(params),
    post: (params: PostParams) => postRequest(params),
  }
) => ({
  getContract: async (contractId: string) => {
    return client.get({
      url: `/contract/approver/contracts/${contractId}`,
    }) as Promise<ApiResponse<ContractDetail>>;
  },

  getApproveStatus: async (contractId: string) => {
    return client.get({
      url: `/contract/approver/contracts/${contractId}/approve/status`,
    }) as Promise<ApiResponse<{ status: boolean }>>;
  },

  approveContract: async (contractId: string, payload: ApprovalActionDTO) => {
    return client.post({
      url: `/contract/approver/contracts/${contractId}/approve`,
      payload,
    }) as Promise<ApiResponse<ContractDetail>>;
  },
  getChangeStats: async (contractId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/change/stats`,
    });
    return res.data as { message?: string; data?: ContractChangeStatsDTO };
  },
  listChanges: async (
    contractId: string,
    query?: { title?: string; type?: string; page?: number; limit?: number }
  ) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/change`,
      config: query ? { params: query } : undefined,
    });
    return res as ApiResponse<{ changes?: ContractChangeDTO[]; total?: number; }>;
  },
  getChangeDetail: async (contractId: string, changeId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/change/${changeId}`,
    });
    return res.data as { message?: string; data?: ContractChangeDTO };
  },
  listChangeComments: async (contractId: string, changeId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/change/${changeId}/comment`,
    });
    return res.data as {
      message?: string;
      data?: { data?: ContractCommentDTO[]; page?: number; limit?: number };
    };
  },
  addChangeComment: async (
    contractId: string,
    changeId: string,
    payload: ContractChangeCommentDTO,
  ) => {
    const res = await client.post({
      url: `/contract/approver/contracts/${contractId}/change/${changeId}/comment`,
      payload,
    });
    return res.data as { message?: string; data?: ContractCommentDTO };
  },
  replyChangeComment: async (changeId: string, commentId: string, payload: ContractChangeReplyDTO) => {
    const res = await client.post({
      url: `/contract/approver/contracts/change/${changeId}/comment/${commentId}/reply`,
      payload,
    });
    return res.data as { message?: string; data?: ContractCommentDTO };
  },
  getChangeApproveStatus: async (contractId: string, changeId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/change/${changeId}/approve/status`,
    });
    return res.data as { message?: string; data?: { status?: boolean } };
  },
  approveChange: async (contractId: string, changeId: string, payload: ApprovalActionDTO) => {
    const res = await client.post({
      url: `/contract/approver/contracts/${contractId}/change/${changeId}/approve`,
      payload,
    });
    return res.data as { message?: string; data?: ContractChangeDTO };
  },

  getNcrStats: async (contractId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/ncrs/stats`,
    });
    return res.data as { message?: string; data?: ContractNcrStatsDTO };
  },

  listNcrs: async (contractId: string, query?: ManagerListNcrsQuery) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/ncrs`,
      config: query ? { params: query } : undefined,
    });
    return res.data as { message?: string; data?: ContractNcrSummary[] };
  },
  createNcr: async (contractId: string, payload: ContractNcrCreateDTO) => {
    const res = await client.post({
      url: `/contract/approver/contracts/${contractId}/ncrs`,
      payload,
    });
    return res.data as {
      message?: string;
      data?: {
        _id?: string;
        ncrId?: string;
        title?: string;
        description?: string;
        status?: string;
      };
    };
  },
  createRfi: async (dataId: string, payload: ContractRfiDTO) => {
    const res = await client.post({
      url: `/contract/approver/contracts/${dataId}/rfi`,
      payload,
    });
    return res.data as { message?: string; data?: ContractRfiDTO };
  },
  listRfis: async (contractId: string, query?: ManagerListRfisQuery) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/rfi`,
      config: query ? { params: query } : undefined,
    });
    return res.data as {
      message?: string;
      data?: {
        contractRfis?: any[];
        total?: number;
        page?: number;
        skip?: number;
      };
    };
  },
  getRfiDetail: async (rfiId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/rfi/${rfiId}`,
    });
    return res.data as { message?: string; data?: ContractRfiDTO };
  },
  listRfiComments: async (contractId: string, rfiId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/rfi/${rfiId}/comment`,
    });
    return res.data as {
      message?: string;
      data?: { data?: ContractCommentDTO[]; page?: number; limit?: number };
    };
  },
  addRfiComment: async (
    contractId: string,
    rfiId: string,
    payload: ContractChangeCommentDTO,
  ) => {
    const res = await client.post({
      url: `/contract/approver/contracts/${contractId}/rfi/${rfiId}/comment`,
      payload,
    });
    return res.data as { message?: string; data?: ContractCommentDTO };
  },
  replyRfiComment: async (
    rfiId: string,
    commentId: string,
    payload: ContractChangeReplyDTO,
  ) => {
    const res = await client.post({
      url: `/contract/approver/contracts/rfi/${rfiId}/comment/${commentId}/reply`,
      payload,
    });
    return res.data as { message?: string; data?: ContractCommentDTO };
  },

  getInvoiceStats: async (contractId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/invoice/stats`,
    });
    return res.data as { message?: string; data?: ContractInvoiceStatsDTO };
  },
  listInvoices: async (contractId: string, query?: ManagerListInvoicesQuery) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/invoice`,
      config: query ? { params: query } : undefined,
    });
    return res.data as {
      message?: string;
      data?: { invoices?: ContractInvoiceDTO[]; total?: number };
    };
  },
  getInvoiceDetail: async (contractId: string, invoiceId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/invoice/${invoiceId}`,
    });
    return res.data as { message?: string; data?: ContractInvoiceDTO };
  },
  getInvoiceApproveStatus: async (contractId: string, invoiceId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/invoice/${invoiceId}/approve/status`,
    });
    return res.data as { message?: string; data?: { status?: boolean } };
  },
  approveInvoice: async (
    contractId: string,
    invoiceId: string,
    payload: ApprovalActionDTO
  ) => {
    const res = await client.post({
      url: `/contract/approver/contracts/${contractId}/invoice/${invoiceId}/approve`,
      payload,
    });
    return res.data as { message?: string; data?: ContractInvoiceDTO };
  },

  getClaimStats: async (contractId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/claims/stats`,
    });
    return res.data as { message?: string; data?: ContractClaimStatsDTO };
  },
  listClaims: async (contractId: string, query?: ManagerListClaimsQuery) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/claim`,
      config: query ? { params: query } : undefined,
    });
    return res.data as {
      message?: string;
      data?: { changes?: ContractClaimDTO[]; total?: number };
    };
  },
  getClaimDetail: async (contractId: string, claimId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/claims/${claimId}`,
    });
    return res.data as { message?: string; data?: ContractClaimDTO };
  },
  getClaimApproveStatus: async (contractId: string, claimId: string) => {
    const res = await client.get({
      url: `/contract/approver/contracts/${contractId}/claims/${claimId}/approve/status`,
    });
    return res.data as { message?: string; data?: { status?: boolean } };
  },
  approveClaim: async (
    contractId: string,
    claimId: string,
    payload: ApprovalActionDTO
  ) => {
    const res = await client.post({
      url: `/contract/approver/contracts/${contractId}/claims/${claimId}/approve`,
      payload,
    });
    return res.data as { message?: string; data?: ContractClaimDTO };
  },
});

export const approverApi = createApproverApi();
