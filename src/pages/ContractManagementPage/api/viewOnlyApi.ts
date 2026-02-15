import { getRequest } from "@/lib/axiosInstance";
import type { ApiResponse, ContractDetail } from "@/types";
import type { AxiosRequestConfig } from "axios";

type ViewOnlyContractPartyDTO = {
  _id?: string;
  name?: string;
  email?: string;
  role?: { _id?: string; name?: string };
  phone?: string;
};

type ViewOnlyContractTypeDTO = {
  _id?: string;
  name?: string;
};

type ViewOnlyContractPersonnelDTO = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
};

type ViewOnlyContractDTO = Omit<
  Partial<ContractDetail>,
  "project" | "vendor" | "contractType" | "creator" | "internalTeam" | "vendorPersonnel"
> & {
  project?: ViewOnlyContractTypeDTO | string;
  vendor?: ViewOnlyContractTypeDTO | string;
  contractType?: ViewOnlyContractTypeDTO | string;
  creator?: ViewOnlyContractPartyDTO;
  internalTeam?: ViewOnlyContractPartyDTO[];
  vendorPersonnel?: ViewOnlyContractPersonnelDTO[];
};

type GetParams = { url: string; config?: AxiosRequestConfig };

const normalizeViewOnlyContract = (
  contract?: ViewOnlyContractDTO,
): ContractDetail | undefined => {
  if (!contract) return undefined;
  return contract as ContractDetail;
};

export const createViewOnlyApi = (
  client = {
    get: (params: GetParams) => getRequest(params),
  },
) => ({
  getContract: async (contractId: string) => {
    const res = (await client.get({
      url: `/user/contract/${contractId}`,
    })) as ApiResponse<ViewOnlyContractDTO>;
    return {
      ...res,
      data: {
        ...res.data,
        data: normalizeViewOnlyContract(res.data?.data),
      },
    } as ApiResponse<ContractDetail>;
  },
});

export const viewOnlyApi = createViewOnlyApi();
