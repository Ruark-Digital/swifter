import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ContractDetail } from "@/types";
import { AxiosRequestConfig } from "axios";

type GetParams = { url: string; config?: AxiosRequestConfig };

export const createVendorApi = (
  client = {
    get: (params: GetParams) => getRequest(params),
  }
) => ({
  getContract: async (contractId: string) => {
    const res = await client.get({
      url: `/vendor/contract/${contractId}`,
    });
    return res as ApiResponse<ContractDetail>;
  },
});

export const vendorApi = createVendorApi();
