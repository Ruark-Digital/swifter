import { AxiosResponse, AxiosError } from "axios";

export type UserRole =
  | "evaluator"
  | "vendor"
  | "approver"
  | "view_only"
  | "company_admin"
  | "super_admin"
  | "procurement"
  | "contract_manager";

export type Role = {
  _id: string;
  name: UserRole;
  __v: number;
};

export interface Modules {
  contractManagement: boolean;
  _id: string;
  companyId: string;
  solicitationManagement: boolean;
  evaluationsManagement: boolean;
  vendorManagement: boolean;
  reportsAnalytics: boolean;
  vendorsQA: boolean;
  generalUpdatesNotifications: boolean;
  addendumManagement: boolean;
  myActions: boolean;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

export type User = {
  _id: string;
  companyId: { name: string; _id: string };
  createdAt: string;
  email: string;
  name: string;
  role: Role;
  status: string;
  module: Modules;
  updatedAt: string;
  avatar?: string;
  phone?: string;
  department?: string;
  businessType?: string;
  location?: string;
  secondaryEmail?: string[];
  website?: string;
  logo?: string;
  vendorId?: string;
  isAi: boolean;
  isDeleted: boolean;
  contactEmail: string;
};

export type ApiError = {
  status: boolean;
  message: string;
};

export type ApiData<T = unknown> = {
  status: boolean;
  message: string;
  data: T;
};

export type ApiList<T = unknown> = {
  total: number;
  page: number;
  limit: number;
  data: T[];
};

export type ApiResponse<T = unknown> = AxiosResponse<ApiData<T>>;
export type ApiResponseError = AxiosError<ApiError>;

export interface SubscriptionPlan {
  _id: string;
  name: string;
  __v: number;
  createdAt: Date;
  features: any[];
  isActive: boolean;
  maxUsers: number;
  price: number;
  updatedAt: Date;
}

export interface Vendor {
  vendorId: string;
  name: string;
  businessType?: string;
  website?: string;
  location?: string;
  phone?: string;
  secondaryEmails?: string[];
  submissions: {
    name: string;
    fileType: string;
    link: string;
    fileSize: string;
    status: string;
    createdAt: string;
  }[];
  documents: {
    id: string;
    name: string;
    type: "DOC" | "PDF" | "XLS";
    size: string;
    createdAt: string;
  }[];
  status: string;
  isSuspended?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    email: string;
    name: string;
  };
}

export interface ContractDetail {
  contractFormationStage: ContractFormationStage;
  _id:                    string;
  company:                string;
  project:                ContractType;
  solicitation:           string;
  vendor:                 ContractType;
  vendorPersonnel:        VendorPersonnel[];
  creator:                Creator;
  contractType:           ContractType;
  contractTerm:           string;
  internalTeam:           Creator[];
  managers:               any[];
  businessDivision:       string;
  rating:                 number;
  title:                  string;
  contractRelationship:   string;
  contractId:             string;
  description:            string;
  jobTitle:               string;
  category:               string;
  visibility:             string;
  currency:               string;
  contractValue:          number;
  contigency:             string;
  holdBack:               number;
  holdBackBank:           number;
  paymentTerms:           string;
  paymentStructure:       string;
  insurance:              Insurance;
  startDate:              string;
  endDate:                string;
  duration:               number;
  deliverables:           Deliverable[];
  files:                  File[];
  currentApprovalLevel:   number;
  approvers:              Approver[];
  status:                 string;
  datePublished:          string;
  timezone:               string;
  isDeleted:              boolean;
  milestone:              any[];
  signatories:            any[];
  createdAt:              string;
  updatedAt:              string;
  __v:                    number;
  holdBackReleased:       number;
  savingAmount:           number;
}
 
export interface Approver {
  user:        ContractUser[];
  level:       number;
  amount:      number;
  group:       string;
  levelStatus: string;
  _id:         string;
}

export interface ContractUser {
  user:    string;
  userRef: string;
  _id:     string;
}

export interface ContractFormationStage {
  draft:     Approval;
  review:    Approval;
  approval:  Approval;
  execution: Approval;
}

export interface Approval {
  startDate: Date;
  endDate:   Date;
}

export interface ContractType {
  _id:  string;
  name: string;
}

export interface Creator {
  _id:   string;
  name:  string;
  email: string;
  role?: ContractType;
}

export interface Deliverable {
  dueDate: Date;
  name:    string;
  _id:     string;
}

export interface File {
  name:       string;
  url:        string;
  type:       string;
  size:       string;
  _id:        string;
  uploadedAt: Date;
}

export interface Insurance {
  _id:                  string;
  contract:             string;
  contractSecurity:     boolean;
  contractSecurityType: any[];
  expiryDate:           Date;
  policy:               Policy[];
  __v:                  number;
}

export interface Policy {
  policyId:   string;
  policyName: string;
  value:      number;
  _id:        string;
}

export interface VendorPersonnel {
  name:  string;
  email: string;
  phone: string;
  role:  string;
  _id:   string;
}

export interface ContractRfis {
  _id:              string;
  contractRef:      string;
  contractRefModel: string;
  company:          string;
  rfiId:            string;
  title:            string;
  type:             string;
  submittedBy:      string;
  description:      string;
  deadline:         Date;
  status:           string;
  files:            any[];
  createdAt:        Date;
  updatedAt:        Date;
  __v:              number;
}
