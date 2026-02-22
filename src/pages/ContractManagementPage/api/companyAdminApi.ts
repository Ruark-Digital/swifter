import { getRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ContractDetail } from "@/types";
import type { AxiosRequestConfig } from "axios";

type CompanyAdminVendorDTO = {
  _id?: string;
  name?: string;
  email?: string;
  role?: { _id?: string; name?: string };
  phone?: string;
};

type CompanyAdminContractTypeDTO = {
  _id?: string;
  name?: string;
};

type CompanyAdminPersonnelDTO = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
};

type CompanyAdminContractDTO = Omit<
  Partial<ContractDetail>,
  "project" | "vendor" | "contractType" | "creator" | "internalTeam" | "vendorPersonnel"
> & {
  project?: CompanyAdminContractTypeDTO | string;
  vendor?: CompanyAdminVendorDTO | string;
  contractType?: CompanyAdminContractTypeDTO | string;
  creator?: CompanyAdminVendorDTO;
  internalTeam?: CompanyAdminVendorDTO[];
  vendorPersonnel?: CompanyAdminPersonnelDTO[];
};

type GetParams = { url: string; config?: AxiosRequestConfig };

type RequestOptions = {
  config?: AxiosRequestConfig;
  retry?: number;
};

const normalizeCompanyAdminContract = (
  contract?: CompanyAdminContractDTO,
): ContractDetail | undefined => {
  if (!contract) return undefined;
  return contract as ContractDetail;
};

const requestWithRetry = async <T,>(
  fn: () => Promise<T>,
  retryCount = 0,
): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export const createCompanyAdminApi = (
  client = {
    get: (params: GetParams) => getRequest(params),
  },
) => ({
  getContract: async (contractId: string, options?: RequestOptions) => {
    const res = await requestWithRetry(
      () =>
        client.get({
          url: `/user/contract/${contractId}`,
          config: options?.config,
        }),
      options?.retry ?? 0,
    );
    const typedRes = res as ApiResponse<CompanyAdminContractDTO>;
    return {
      ...typedRes,
      data: {
        ...typedRes.data,
        data: normalizeCompanyAdminContract(typedRes.data?.data),
      },
    } as ApiResponse<ContractDetail>;
  },
});

export const companyAdminApi = createCompanyAdminApi();
