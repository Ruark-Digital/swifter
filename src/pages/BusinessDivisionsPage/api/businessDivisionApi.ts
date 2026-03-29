import { getRequest, postRequest, putRequest } from "@/lib/axiosInstance";

export type BusinessDivision = {
  _id: string;
  name: string;
  location: string;
  totalProjects?: number;
  totalContracts?: number;
  totalProjectValue?: number;
  totalContractValue?: number;
  company?: string;
};

export type ListBusinessDivisionsQuery = {
  page: number;
  limit: number;
  search?: string;
};

export type BusinessDivisionList = {
  docs?: BusinessDivision[];
  totalDocs?: number;
  limit?: number;
  page?: number;
  totalPages?: number;
};

export type BusinessDivisionStats = {
  totalDivisions?: number;
};

export type CreateBusinessDivisionPayload = {
  name: string;
  location: string;
};

export type UpdateBusinessDivisionPayload = {
  name: string;
  location: string;
};

export type CreateBusinessDivisionResponse = {
  _id?: string;
  name?: string;
  location?: string;
  company?: string;
};

export const businessDivisionApi = {
  getDivisionStats: async () => {
    const res = await getRequest({ url: "/contract/manager/business-division/stats" });
    return res.data as { message?: string; data?: BusinessDivisionStats };
  },
  listDivisions: async (query: ListBusinessDivisionsQuery) => {
    const res = await getRequest({
      url: "/contract/manager/business-division",
      config: { params: query },
    });
    return res.data as { message?: string; data?: BusinessDivisionList };
  },
  getDivisionById: async (divisionId: string) => {
    const res = await getRequest({
      url: `/contract/manager/business-division/${encodeURIComponent(divisionId)}`,
    });
    return res.data as { message?: string; data?: BusinessDivision };
  },
  createDivision: async (payload: CreateBusinessDivisionPayload) => {
    const res = await postRequest({
      url: "/contract/manager/business-division",
      payload,
    });
    return res.data as { message?: string; data?: CreateBusinessDivisionResponse };
  },
  updateDivision: async (divisionId: string, payload: UpdateBusinessDivisionPayload) => {
    const res = await putRequest({
      url: `/contract/manager/business-division/${encodeURIComponent(divisionId)}`,
      payload,
    });
    return res.data as { message?: string; data?: CreateBusinessDivisionResponse };
  },
};
