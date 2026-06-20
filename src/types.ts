import { AxiosResponse, AxiosError } from "axios";

export type UserRole =
  | "evaluator"
  | "vendor"
  | "project_manager"
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
  currency?: string;
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
  projectmanagerId?: string;
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

export interface ProjectManager {
  user: {
    _id: string;
    name: string;
  };
  status: string;
}

export interface ContractDetail {
  contractFormationStage: ContractFormationStage;
  _id:                    string;
  company:                Company;
  project:                Company;
  solicitation:           Company;
  vendor:                 Company;
  msaContract?:           { _id: string; title: string };
  vendorPersonnel:        VendorPersonnel[];
  /** Returned by the new /edit endpoint (swagger 2.3.0). The legacy
   *  detail endpoint exposes the same data under `vendorPersonnel`;
   *  callers should accept either, preferring `personnel` when set. */
  personnel?:             VendorPersonnel[];
  creator:                Creator;
  contractType:           Company;
  contractTerm:           Company;
  internalTeam:           Approver[];
  managers:               any[];
  businessDivision:       BusinessDivision;
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
  /** API v2.3.0 corrected the spelling on the contract-detail response
   *  (ContractServiceDetail.contingency). Accept either; `contigency`
   *  is the legacy key. */
  contingency?:           string;
  holdBack:               number;
  holdBackBank:           number;
  paymentTerms:           Company;
  projectManager:         ProjectManager;
  paymentStructure:       string;
  deliverables:           ContractDeliverable[];
  insurance:              ContractInsurance;
  startDate:              string;
  endDate:                string;
  duration:               number;
  files:                  File[];
  currentApprovalLevel:   number;
  approvers:              ContractApprover[];
  status:                 string;
  timezone:               string;
  isDeleted:              boolean;
  milestone:              any[];
  signatories:            any[];
  datePublished?:         string;
  createdAt:              string;
  updatedAt:              string;
  __v:                    number;
  holdBackReleased:       number;
  savingAmount:           number;
}

export interface ContractDeliverable {
  name: string;
  dueDate?: Date | string;
  _id?: string;
}

export interface ContractInsurance {
  policy: {
    policyName: string;
    value?: string | number;
    limit?: string | number;
    _id?: string;
  }[];
  contractSecurityType: {
    securityType: string;
    amount?: string | number;
    dueDate?: Date | string;
    _id?: string;
  }[];
  expiryDate?: Date | string;
  contractSecurity?: boolean;
}

export interface ContractApprover {
  group: string;
  user: {
    user: string;
    userRef?: string;
    email?: string;
  }[];
  level: number;
  amount?: number;
  _id?: string;
}

export interface Approver {
  id:    string;
  name:  string;
  email: string;
  role?: string;
}

export interface BusinessDivision {
  _id:      string;
  name:     string;
  location: string;
}

export interface Company {
  _id:  string;
  name: string;
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

export interface Creator {
  _id:   string;
  name:  string;
  email: string;
  role: string
}

export interface File {
  name:       string;
  url:        string;
  type:       string;
  size:       string;
  _id:        string;
  uploadedAt: string;
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

export interface VendorReportRow {
  _id: string;
  reportId: string;
  title: string;
  submittedBy: string;
  submissionDate: string;
  status?: string;
  description?: string;
  files?: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

export interface ReportDetails {
  _id: string;
  reportId: string;
  title: string;
  description: string;
  status: string;
  submittedBy: {
    _id: string;
    name: string;
    email: string;
  };
  submissionDate: string;
  responseDeadline?: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  comments?: Array<{
    _id: string;
    comment: string;
    createdBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
  }>;
}

export interface ReportDetailsSheetProps {
  trigger: React.ReactNode;
}
