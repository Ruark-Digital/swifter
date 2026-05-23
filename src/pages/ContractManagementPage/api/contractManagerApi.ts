import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from "@/lib/axiosInstance";
import { ApiResponse, ContractDetail, ContractRfis } from "@/types";
import type { AxiosRequestConfig } from "axios";
import * as yup from "yup";

const nonEmptyStringSchema = yup.string().trim().min(1, "Required");

const createContractInputSchema: yup.ObjectSchema<CreateContractInput> = yup
  .object({
    title: nonEmptyStringSchema.required(),
    description: nonEmptyStringSchema.required(),
    category: nonEmptyStringSchema.required(),
    timezone: nonEmptyStringSchema.required(),
    contractType: nonEmptyStringSchema.required(),
    contractRelationship: yup
      .mixed<CreateContractInput["contractRelationship"]>()
      .oneOf(["standalone", "project", "msa_project"])
      .required(),
    rating: yup.number().required(),
    projectId: yup.string().optional(),
    status: yup
      .mixed<NonNullable<CreateContractInput["status"]>>()
      .oneOf(["draft", "publish"] as const)
      .optional(),
    msaContractId: yup.string().optional(),
    solicitationId: yup.string().optional(),
    businessDivision: yup.string().optional(),
    currency: yup.string().optional(),
    currencyRate: yup.number().optional(),
    contractPaymentTerm: yup.string().optional(),
    contractTermType: yup.string().optional(),
    contractId: yup.string().optional(),
    jobTitle: yup.string().optional(),
    vendor: yup.string().optional(),
    personnel: yup.array().optional(),
    internalTeam: yup.array().optional(),
    visibility: yup
      .mixed<NonNullable<CreateContractInput["visibility"]>>()
      .oneOf(["public", "private"] as const)
      .optional(),
    contractAmount: yup.number().optional(),
    contigency: yup.string().optional(),
    holdBack: yup.number().optional(),
    paymentTerm: yup.string().optional(),
    paymentStructure: yup
      .mixed<NonNullable<CreateContractInput["paymentStructure"]>>()
      .oneOf(["Monthly", "Milestone", "Progress Draw"] as const)
      .optional(),
    startDate: yup.string().optional(),
    endDate: yup.string().optional(),
    duration: yup.number().optional(),
    termType: yup.string().optional(),
    deliverable: yup
      .object<CreateContractInput["deliverable"]>({
        name: yup.string().optional(),
        dueDate: yup.string().optional(),
      })
      .optional(),
    deliverables: yup
      .array()
      .of(
        yup.object<NonNullable<CreateContractInput["deliverables"]>[number]>({
          name: yup.string().optional(),
          dueDate: yup.string().optional(),
        }),
      )
      .optional(),
  })
  .required();

const approvalActionSchema: yup.ObjectSchema<ApprovalActionDTO> = yup
  .object({
    action: yup
      .mixed<NonNullable<ApprovalActionDTO["action"]>>()
      .oneOf(["approved", "rejected"] as const)
      .required(),
    comment: yup.string().min(1, "Comment is required").required(),
  })
  .required();

const toValidationMessage = (err: unknown) => {
  if (err instanceof yup.ValidationError) {
    return err.errors.length ? err.errors.join(", ") : err.message;
  }
  return "Validation failed";
};

const assertValid = async <T>(schema: yup.Schema<T>, value: unknown) => {
  try {
    await schema.validate(value, { abortEarly: false });
  } catch (err) {
    throw new Error(toValidationMessage(err));
  }
};

export type ContractManagerContractStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "completed"
  | "cancelled"
  | "expired"
  | "terminated";

export type ContractManagerContractRelationship =
  | "standalone"
  | "project"
  | "msa_project";

export type ContractManagerContractType = "hourly" | "fixed" | "milestone";

export type ContractFile = {
  name?: string;
  url?: string;
  type?: string;
  size?: string;
};

export type ContractDeliverable = {
  name?: string;
  dueDate?: string;
};

export type Contract = {
  _id?: string;
  title?: string;
  description?: string;
  category?: string;
  contractRelationship?: ContractManagerContractRelationship;
  status?: ContractManagerContractStatus;
  deliverables?: ContractDeliverable[];
  files?: ContractFile[];
  signatories?: string[];
  approver?: string[];
  createdAt?: string;
  updatedAt?: string;
  company?: string;
  project?: string;
  vendor?: string;
  creator?: string;
  contractType?: ContractManagerContractType;
  currency?: string;
  ratePerHour?: number;
  totalAmount?: number;
  startDate?: string;
  endDate?: string;
};

export type ApiResponseContract = {
  status?: number;
  message?: string;
  data?: Contract;
};

export type ApiResponseContractList = {
  status?: number;
  message?: string;
  data?: Contract[];
};

export type ContractRfiDTO = {
  title?: string;
  description?: string;
  issueRfi?: string;
  responder?: string;
  deadline?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
};

export interface ContractRFIDetailDTO {
  contractRfi: ContractRFI;
  isResponse?:  IsResponse;
}

export interface ContractRFI {
  _id:              string;
  contractRef:      string;
  contractRefModel: string;
  company:          string;
  rfiId:            string;
  title:            string;
  issueRfi:         string;
  type:             string;
  submittedBy:      SubmittedBy;
  description:      string;
  deadline:         Date;
  status:           string;
  files:            File[];
  createdAt:        Date;
  updatedAt:        Date;
  __v:              number;
}

export interface File {
  name:       string;
  url:        string;
  type:       string;
  size:       string;
  _id:        string;
  uploadedAt: Date;
}

export interface SubmittedBy {
  _id:   string;
  name:  string;
  email: string;
}

export interface IsResponse {
  _id: string;
}


export type ContractRfiResponseDTO = {
  description?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
};

export type ContractNcrSummary = {
  _id?: string;
  ncrId?: string;
  title?: string;
  status?: "pending" | "approved" | "rejected";
};

export type ContractNcrStatsDTO = {
  total?: number;
  issue?: number;
  receive?: number;
};

export type ContractChangeApprover = {
  _id?: string;
  level?: number;
  amount?: number;
  group?: string;
  levelStatus?: "pending" | "approved" | "rejected";
  completedAt?: string;
  user?: Array<{
    _id?: string;
    user?: string;
    status?: "pending" | "approved" | "rejected";
    comment?: string;
    actionedAt?: string;
  }>;
};

export interface ContractHoldBackDTO {
  _id:              string;
  contract:         string;
  contractRefModel: string;
  company:          string;
  amount:           number;
  holdBackId:       string;
  invoiceId?:       string;
  type:             string;
  status:           string;
  approvedBy:       string;
  description:      string;
  releasedDate:     Date;
  files:            File[];
  __v:              number;
}

export interface File {
  name:       string;
  url:        string;
  type:       string;
  size:       string;
  _id:        string;
  uploadedAt: Date;
}


export interface ContractSavingDTO {
  _id:              string;
  contract:         string;
  contractRefModel: string;
  company:          string;
  amount:           number;
  savingId:         string;
  title:            string;
  category:         string;
  submittedDate:    Date;
  description:      string;
  files:            File[];
  __v:              number;
}

export interface File {
  name:       string;
  url:        string;
  type:       string;
  size:       string;
  _id:        string;
  uploadedAt: Date;
}


export type ContractChangeManagerDTO = {
  title?: string;
  description?: string;
  proposalCategory?: string;
  urgency?: "low" | "medium" | "high";
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: number;
  }>;
  type?: "directive" | "order";
};

export type ContractChangeDTO = {
  id?: string;
  changeId?: string;
  title?: string;
  description?: string;
  proposalCategory?: string;
  urgency?: "low" | "medium" | "high";
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: number;
  }>;
  type?: "request" | "directive" | "proposal" | "order";
  value?: number;
  submittedAt?: string;
  approverStatus?: "N/A" | "pending" | "approved" | "rejected";
  status?: "pending" | "approved" | "rejected";
};

export type ContractChangeStatsDTO = {
  all?: number;
  request?: number;
  order?: number;
  directive?: number;
  proposal?: number;
  approved?: number;
  pending?: number;
  rejected?: number;
  // Approver `/changes/stats` returns these aliases instead of
  // approved/rejected — surfaced as fallbacks in the UI.
  completed?: number;
  cancelled?: number;
};

export type ApprovalActionDTO = {
  action: "approved" | "rejected";
  comment: string;
};

export type ContractChangeCommentDTO = {
  content?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
};

export type ContractChangeReplyDTO = {
  parentCommentId?: string;
  content?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
};

export type ContractCommentDTO = {
  _id?: string;
  contract?: string;
  commentRef?: string;
  commentRefModel?: string;
  company?: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
    role?: { _id?: string; name?: string };
  };
  replyTo?: { _id?: string; name?: string; email?: string };
  parent?: string;
  content?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
    uploadedAt?: string;
  }>;
  children?: ContractCommentDTO[];
  createdAt?: string;
  updatedAt?: string;
};

export type ContractClaimDTO = {
  _id?: string;
  claimId?: string;
  title?: string;
  status?: "under review" | "approved" | "rejected" | "dispute";
  type?: string;
  impact?: "time" | "cost" | "time_cost";
  time?: number;
  cost?: number;
  description?: string;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
  manager?: { status?: string; comment?: string };
  approvers?: ContractChangeApprover[];
};

export type ContractClaimStatsDTO = {
  total?: number;
  pending?: number;
  approved?: number;
  rejected?: number;
  dispute?: number;
};

export type ContractInvoiceDTO = {
  _id?: string;
  invoiceId?: string;
  title?: string;
  type?: "progress draw" | "monthly payment" | "milestone payment" | "holdback";
  taxCode?: string;
  taxValue?: number;
  description?: string;
  fileType?: "manual" | "file";
  inputType?: "manual" | "file";
  amount?: number;
  status?: "pending" | "approved" | "rejected" | "draft" | "active";
  lem?: unknown;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
  approverStatus?: "pending" | "approved" | "rejected";
  manager?: { status?: string; comment?: string };
  approvers?: ContractChangeApprover[];
};

export type ContractInvoiceStatsDTO = {
  all?: number;
  pending?: number;
  accepted?: number;
  rejected?: number;
};

export type ContractLemDTO = {
  title?: string;
  description?: string;
  amount?: number;
  files?: Array<{
    name?: string;
    url?: string;
    type?: string;
    size?: string;
  }>;
};

export type ManagerListLemsQuery = {
  lemId?: string;
  title?: string;
  page?: number;
  limit?: number;
};

export type ContractApproverSummary = {
  approverId?: string;
  name?: string;
  email?: string;
  role?: string;
  approvalLevels?: number[];
  assignedApprovals?: string;
  status?: "Completed" | "Pending";
};

export type ContractApproverAction = {
  _id?: string;
  company?: string;
  status?: "pending" | "approved" | "rejected";
  title?: "change" | "invoice" | "lem" | "claim";
  comment?: string;
  contractDetailRef?: string;
  contractDetailRefModel?:
    | "ContractClaim"
    | "ContractChange"
    | "ContractRfi"
    | "ContractInvoice"
    | "ContractLem"
    | "ContractAmendment";
  approvedDate?: string;
};

export type ContractApproverDetail = {
  approver?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  details?: ContractApproverAction[];
};

export type ContractAmendmentStatsDTO = {
  accepted?: number;
  all?: number;
  rejected?: number;
  pending?: number;
};

export type ContractAmendmentDTO = {
  _id?: string;
  amendmentId?: string;
  title?: string;
  amendmentTitle?: string;
  status?: string;
  vendorStatus?: string;
};

export type CreateContractInput = {
  title: string;
  description: string;
  category: string;
  timezone: string;
  contractType: string;
  contractRelationship: "standalone" | "project" | "msa_project";
  rating: number;
  projectId?: string;
  status?: "draft" | "publish";
  msaContractId?: string;
  solicitationId?: string;
  businessDivision?: string;
  currency?: string;
  currencyRate?: number;
  contractPaymentTerm?: string;
  contractTermType?: string;
  contractId?: string;
  jobTitle?: string;
  vendor?: string;
  personnel?: Array<{
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
  }>;
  internalTeam?: string[];
  visibility?: "public" | "private";
  contractAmount?: number;
  contigency?: string;
  holdBack?: number;
  paymentTerm?: string;
  paymentStructure?: "Monthly" | "Milestone" | "Progress Draw";
  startDate?: string;
  endDate?: string;
  duration?: number;
  termType?: string;
  deliverable?: { name?: string; dueDate?: string };
  deliverables?: Array<{ name?: string; dueDate?: string }>;
};

export type ManagerListChangesQuery = {
  title?: string;
  type?: string;
  page?: number;
  limit?: number;
};

export type ManagerListClaimsQuery = {
  title?: string;
  type?: string;
  page?: number;
  limit?: number;
};

export type ManagerListInvoicesQuery = {
  invoiceId?: string;
  page?: number;
  limit?: number;
};

export type ManagerListRfisQuery = {
  title?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export type ContractComplianceDTO = {
  details?: {
    coverage?: number;
    security?: boolean;
    expDate?: string;
    policyStatus?: {
      status?: "pending" | "submitted" | "approved" | "rejected";
      submissionDate?: string;
      description?: string | null;
      files?: Array<{
        name?: string;
        url?: string;
        type?: string;
        size?: string;
        uploadedAt?: string;
      }>;
      manager?: {
        user?: string;
        status?: "pending" | "approved" | "rejected";
        comment?: string | null;
        actionedAt?: string;
      };
    };
    securityType?: Array<{
      securityTypeId?: string;
      securityType?: string;
      amount?: number;
      dueDate?: string;
      _id?: string;
    }>;
    insuranceStatus?: "pending" | "approved" | "rejected";
    securityStatus?:
      | "pending"
      | "approved"
      | "rejected"
      | {
          status?: "pending" | "submitted" | "approved" | "rejected";
          submissionDate?: string;
          description?: string | null;
          files?: Array<{
            name?: string;
            url?: string;
            type?: string;
            size?: string;
            uploadedAt?: string;
          }>;
          manager?: {
            user?: string;
            status?: "pending" | "approved" | "rejected";
            comment?: string | null;
            actionedAt?: string;
          };
        };
    submissionDate?: string;
    files?: Array<{
      name?: string;
      url?: string;
      type?: string;
      size?: string;
      _id?: string;
      uploadedAt?: string;
    }>;
  };
  policy?: Array<{
    _id?: string;
    policyId?: string;
    policyName?: string;
    value?: number;
    status?: string;
    description?: string;
    createdAt?: string;
  }>;
  security?: Array<{
    _id?: string;
    securityTypeId?: string;
    securityType?: string;
    amount?: number;
    dueDate?: string;
    status?: string;
    description?: string;
    createdAt?: string;
  }>;
};

export type ManagerListNcrsQuery = {
  title?: string;
  ncrId?: string;
  page?: number;
  limit?: number;
};

export interface LogModule {
  "stripe out contract": string;
}

export interface ContractLogDetailDTO {
  _id:                    string;
  contract:               ContractLogDetail;
  contractDef:            string;
  company:                string;
  contractDetailRef:      string;
  contractDetailRefModel: string;
  user:                   User;
  userRef:                string;
  action:                 string;
  type:                   string;
  meta:                   Meta;
  logId:                  string;
  createdAt:              string;
  updatedAt:              string;
  __v:                    number;
}

export interface ContractLogDetail {
  _id:        string;
  contractId: string;
}

export interface Meta {
  level:  number;
  status: string;
}

export interface User {
  _id:  string;
  name: string;
}


export interface ContractLogDTO {
  logId?:   string;
  actionId:  string;
  module:    LogModule;
  user:      string;
  actor:     string;
  date:      Date;
  reference: string;
}

export type ManagerListLogsQuery = {
  logId?: string;
  module?: string;
  page?: number;
  limit?: number;
};

type HttpGet = (args: {
  url: string;
  config?: AxiosRequestConfig;
}) => Promise<{ data: unknown }>;
type HttpPost = (args: {
  url: string;
  payload: unknown;
  config?: AxiosRequestConfig;
}) => Promise<{ data: unknown }>;
type HttpPut = (args: {
  url: string;
  payload: unknown;
  config?: AxiosRequestConfig;
}) => Promise<{ data: unknown }>;
type HttpDelete = (args: {
  url: string;
  payload?: unknown;
  config?: AxiosRequestConfig;
}) => Promise<{ data: unknown }>;

export type ContractManagerHttpClient = {
  get: HttpGet;
  post: HttpPost;
  put: HttpPut;
  delete: HttpDelete;
};

const CONTRACT_API_PREFIX = "/contract";
const MANAGER_CONTRACTS_PREFIX = `${CONTRACT_API_PREFIX}/manager/contracts`;

const defaultContractManagerHttpClient: ContractManagerHttpClient = {
  get: ({ url, config }) => getRequest({ url, config }),
  post: ({ url, payload, config }) => postRequest({ url, payload, config }),
  put: ({ url, payload, config }) => putRequest({ url, payload, config }),
  delete: ({ url, payload, config }) => deleteRequest({ url, payload, config }),
};

export const createContractManagerApi = (
  client: ContractManagerHttpClient = defaultContractManagerHttpClient,
) => {
  return {
    listContracts: async (): Promise<ApiResponseContractList> => {
      const res = await client.get({ url: `${MANAGER_CONTRACTS_PREFIX}` });
      return res.data as ApiResponseContractList;
    },
    createContract: async (
      payload: CreateContractInput,
    ): Promise<ApiResponseContract> => {
      await assertValid(createContractInputSchema, payload);
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}`,
        payload,
      });
      return res.data as ApiResponseContract;
    },
    getContract: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}`,
      });
      return res as ApiResponse<ContractDetail>;
    },
    /**
     * Fetches the contract in edit-form shape — swagger 2.3.0 added
     * `GET /manager/contracts/{contractId}/edit` which returns a fully
     * populated record specifically meant for pre-filling the edit
     * wizard. Use this from EditContract instead of the read-only
     * detail endpoint above.
     * x-roles: contract_manager, company_admin.
     */
    getContractForEdit: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/edit`,
      });
      return res as ApiResponse<ContractDetail>;
    },
    listContractApprovers: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/approvers`,
      });
      return res.data as { message?: string; data?: ContractApproverSummary[] };
    },
    getContractApproverDetails: async (contractId: string, approverId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/approvers/${approverId}`,
      });
      return res.data as { message?: string; data?: ContractApproverDetail };
    },
    listPaymentHoldbacks: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/payment-holdbacks`,
      });
      return res.data as { message?: string; data?: ContractHoldBackDTO[] };
    },
    createPaymentHoldback: async (
      contractId: string,
      payload: ContractHoldBackDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/payment-holdbacks`,
        payload,
      });
      return res.data as { message?: string; data?: ContractHoldBackDTO };
    },
    getPaymentHoldbackById: async (holdBackId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/payment-holdbacks/${holdBackId}`,
      });
      return res.data as { message?: string; data?: ContractHoldBackDTO };
    },
    listPaymentSavings: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/payment-savings`,
      });
      return res.data as { message?: string; data?: ContractSavingDTO[] };
    },
    createPaymentSaving: async (
      contractId: string,
      payload: ContractSavingDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/payment-savings`,
        payload,
      });
      return res.data as { message?: string; data?: ContractSavingDTO };
    },
    getPaymentSavingById: async (savingId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/payment-savings/${savingId}`,
      });
      return res.data as { message?: string; data?: ContractSavingDTO };
    },
    getChangeStats: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes/stats`,
      });
      return res.data as { message?: string; data?: ContractChangeStatsDTO };
    },
    listChanges: async (
      contractId: string,
      query?: ManagerListChangesQuery,
    ) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes`,
        config: query ? { params: query } : undefined,
      });
      return res as ApiResponse<{ changes?: ContractChangeDTO[]; total?: number }>;
    },
    getChangeDetail: async (changeId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/changes/${changeId}`,
      });
      return res.data as { message?: string; data?: ContractChangeDTO };
    },
    createChangeRequest: async (
      dataId: string,
      type: "Contract" | "MsaContract",
      payload: ContractChangeManagerDTO,
    ) => {
      const createPath =
        type === "MsaContract"
          ? `/contract/manager/msa-contract/${dataId}/change/${type}`
          : `${MANAGER_CONTRACTS_PREFIX}/${dataId}/change/${type}`;
      const res = await client.post({
        url: createPath,
        payload,
      });
      return res.data as { message?: string; data?: ContractChangeDTO };
    },
    approveChange: async (
      contractId: string,
      changeId: string,
      payload: ApprovalActionDTO,
    ) => {
      await assertValid(approvalActionSchema, payload);
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes/${changeId}/approve`,
        payload,
      });
      return res.data as { message?: string };
    },
    getChangeApproveStatus: async (contractId: string, changeId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes/${changeId}/approve/status`,
      });
      return res.data as { message?: string; data?: { status?: string } };
    },
    listChangeApprovers: async (contractId: string, changeId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes/${changeId}/approvers`,
      });
      return res.data as { message?: string; data?: ContractChangeApprover[] };
    },
    listChangeComments: async (contractId: string, changeId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes/${changeId}/comments`,
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
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes/${changeId}/comments`,
        payload,
      });
      return res.data as { message?: string; data?: ContractCommentDTO };
    },
    replyChangeComment: async (
      contractId: string,
      changeId: string,
      commentId: string,
      payload: ContractChangeReplyDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/changes/${changeId}/comments/${commentId}/reply`,
        payload,
      });
      return res.data as { message?: string; data?: ContractCommentDTO };
    },
    getClaimStats: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/stats`,
      });
      return res.data as { message?: string; data?: ContractClaimStatsDTO };
    },
    listClaims: async (contractId: string, query?: ManagerListClaimsQuery) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims`,
        config: query ? { params: query } : undefined,
      });
      return res.data as {
        message?: string;
        data?: { changes?: ContractClaimDTO[]; total?: number };
      };
    },
    getClaimDetail: async (contractId: string, claimId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}`,
      });
      return res.data as { message?: string; data?: ContractClaimDTO };
    },
    approveClaim: async (
      contractId: string,
      claimId: string,
      payload: ApprovalActionDTO,
    ) => {
      await assertValid(approvalActionSchema, payload);
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}/approve`,
        payload,
      });
      return res.data as { message?: string };
    },
    getClaimApproveStatus: async (contractId: string, claimId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}/approve/status`,
      });
      return res.data as { message?: string; data?: { status?: string } };
    },
    listClaimComments: async (contractId: string, claimId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}/comments`,
      });
      return res.data as {
        message?: string;
        data?: { data?: ContractCommentDTO[]; page?: number; limit?: number };
      };
    },
    addClaimComment: async (
      contractId: string,
      claimId: string,
      payload: ContractChangeCommentDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}/comments`,
        payload,
      });
      return res.data as { message?: string; data?: ContractCommentDTO };
    },
    replyClaimComment: async (
      contractId: string,
      claimId: string,
      commentId: string,
      payload: ContractChangeReplyDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}/comments/${commentId}/reply`,
        payload,
      });
      return res.data as { message?: string; data?: ContractCommentDTO };
    },
    listClaimApprovers: async (contractId: string, claimId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}/approvers`,
      });
      return res.data as { message?: string; data?: ContractChangeApprover[] };
    },
    sendClaimToApprovers: async (
      contractId: string,
      claimId: string,
      payload: { userIds: string[] },
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/claims/${claimId}/approvers`,
        payload,
      });
      return res.data as { message?: string; data?: ContractClaimDTO };
    },
    getInvoiceStats: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/invoice/stats`,
      });
      return res.data as { message?: string; data?: ContractInvoiceStatsDTO };
    },
    listInvoices: async (
      contractId: string,
      query?: ManagerListInvoicesQuery,
    ) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/invoice`,
        config: query ? { params: query } : undefined,
      });
      return res.data as {
        message?: string;
        data?: { invoices?: ContractInvoiceDTO[]; total?: number };
      };
    },
    getInvoiceDetail: async (contractId: string, invoiceId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/invoice/${invoiceId}`,
      });
      return res.data as { message?: string; data?: ContractInvoiceDTO };
    },
    approveInvoice: async (
      contractId: string,
      invoiceId: string,
      payload: ApprovalActionDTO,
    ) => {
      await assertValid(approvalActionSchema, payload);
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/invoice/${invoiceId}/approve`,
        payload,
      });
      return res.data as { message?: string; data?: ContractInvoiceDTO };
    },
    listLems: async (contractId: string, query?: ManagerListLemsQuery) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/lems`,
        config: query ? { params: query } : undefined,
      });
      return res.data as {
        message?: string;
        data?: {
          page?: number;
          limit?: number;
          resp?: ContractLemDTO[];
          count?: number;
        };
      };
    },
    getLemDetail: async (contractId: string, lemId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/lems/${lemId}`,
      });
      return res.data as { message?: string; data?: ContractLemDTO };
    },
    getLemApproveStatus: async (contractId: string, lemId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/lems/${lemId}/approve/status`,
      });
      return res.data as { message?: string; data?: { status?: string } };
    },
    approveLem: async (
      contractId: string,
      lemId: string,
      payload: ApprovalActionDTO,
    ) => {
      await assertValid(approvalActionSchema, payload);
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/lems/${lemId}/approve`,
        payload,
      });
      return res.data as { message?: string; data?: unknown };
    },
    getLemRateSheet: async (contractId: string, lemId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/lems/${lemId}/ratesheet`,
      });
      return res.data as { message?: string; data?: { sheet?: unknown } };
    },
    getAmendmentStats: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/amendments/stats`,
      });
      return res.data as { message?: string; data?: ContractAmendmentStatsDTO };
    },
    listAmendments: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/amendments`,
      });
      return res.data as { message?: string; data?: ContractAmendmentDTO[] };
    },
    createAmendment: async (contractId: string, payload: unknown) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/amendments`,
        payload,
      });
      return res.data as { message?: string; data?: unknown };
    },
    getAmendmentDetail: async (amendmentId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/amendments/${amendmentId}`,
      });
      return res.data as { message?: string; data?: unknown };
    },
    addAmendmentApprovers: async (amendmentId: string, payload: unknown) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/amendments/${amendmentId}/approvers`,
        payload,
      });
      return res.data as { message?: string; data?: unknown };
    },
    approveAmendment: async (
      amendmentId: string,
      payload: ApprovalActionDTO,
    ) => {
      await assertValid(approvalActionSchema, payload);
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/amendments/${amendmentId}/approve`,
        payload,
      });
      return res.data as { message?: string; data?: unknown };
    },
    getNcrStats: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/ncrs/stats`,
      });
      return res.data as { message?: string; data?: ContractNcrStatsDTO };
    },
    listNcrs: async (contractId: string, query?: ManagerListNcrsQuery) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/ncrs`,
        config: query ? { params: query } : undefined,
      });
      return res.data as { message?: string; data?: ContractNcrSummary[] };
    },
    createRfi: async (
      dataId: string,
      payload: ContractRfiDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${dataId}/rfi`,
        payload,
      });
      return res.data as { message?: string; data?: ContractRfiDTO };
    },
    listRfis: async (contractId: string, query?: ManagerListRfisQuery) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/rfis`,
        config: query ? { params: query } : undefined,
      });
      return res.data as {
        message?: string;
        data?: {
          contractRfis?: ContractRfis[];
          total?: number;
          page?: number;
          skip?: number;
        };
      };
    },
    getRfiDetail: async (contractId: string, rfiId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/rfis/${rfiId}`,
      });
      return res.data as { message?: string; data?: ContractRFIDetailDTO };
    },
    createRfiResponse: async (
      rfiId: string,
      payload: ContractRfiResponseDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/rfis/${rfiId}/response`,
        payload,
      });
      return res.data as { message?: string; data?: ContractRfiResponseDTO };
    },
    getRfiResponse: async (contractId: string, rfiId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/rfis/${rfiId}/response`,
      });
      return res.data as { message?: string; data?: ContractRfiResponseDTO };
    },
    listRfiComments: async (contractId: string, rfiId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/rfis/${rfiId}/comment`,
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
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/rfis/${rfiId}/comment`,
        payload,
      });
      return res.data as { message?: string; data?: ContractCommentDTO };
    },
    replyRfiComment: async (
      contractId: string,
      rfiId: string,
      commentId: string,
      payload: ContractChangeReplyDTO,
    ) => {
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/rfis/${rfiId}/comment/${commentId}/reply`,
        payload,
      });
      return res.data as { message?: string; data?: ContractCommentDTO };
    },
    getContractCompliance: async (contractId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/compliance`,
      });
      return res.data as { message?: string; data?: ContractComplianceDTO };
    },
    approveComplianceItem: async (
      contractId: string,
      type: "policy" | "security",
      typeId: string,
      payload: ApprovalActionDTO,
    ) => {
      await assertValid(approvalActionSchema, payload);
      const res = await client.post({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/compliance/${type}/${typeId}/approve`,
        payload,
      });
      return res.data as { message?: string; success?: boolean };
    },
    listLogs: async (contractId: string, query?: ManagerListLogsQuery) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/logs`,
        config: query ? { params: query } : undefined,
      });
      return res.data as {
        success?: boolean;
        message?: string;
        data?: {
          logs?: ContractLogDTO[];
          total?: number;
          page?: number;
          limit?: number;
        };
      };
    },
    getLogDetail: async (contractId: string, logId: string) => {
      const res = await client.get({
        url: `${MANAGER_CONTRACTS_PREFIX}/${contractId}/logs/${logId}`,
      });
      return res.data as {
        success?: boolean;
        message?: string;
        data?: ContractLogDetailDTO;
      };
    },
  };
};

export const contractManagerApi = createContractManagerApi();
