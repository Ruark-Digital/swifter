import { getRequest, postRequest, putRequest } from "@/lib/axiosInstance";

export type BusinessDivisionProject = {
  _id: string;
  projectId?: string;
  /** The project's display name. The API returns this as `name`; `title` is
   *  kept as a fallback for any older payload shape. */
  name?: string;
  title?: string;
  budget?: number;
  status?: string;
};

export type BusinessDivisionContract = {
  _id: string;
  contractId?: string;
  title?: string;
  contractValue?: number | null;
  currency?: string | null;
  status?: string;
};

/** Paginated list shape the division-detail endpoint returns for its
 *  `projects` / `contracts` fields. */
export type BusinessDivisionPage<T> = {
  docs?: T[];
  totalDocs?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type BusinessDivision = {
  _id: string;
  businessId?: string;
  name: string;
  location: string;
  totalProjects?: number;
  totalContracts?: number;
  totalProjectValue?: number;
  totalContractValue?: number;
  company?: string;
  /** Older payloads sent plain arrays; the current API sends a paginated object. */
  projects?: BusinessDivisionPage<BusinessDivisionProject> | BusinessDivisionProject[];
  contracts?: BusinessDivisionPage<BusinessDivisionContract> | BusinessDivisionContract[];
  createdAt?: string;
  updatedAt?: string;
};

export type ListBusinessDivisionsQuery = {
  page: number;
  limit: number;
  search?: string;
};

export type BusinessDivisionDetailQuery = {
  projectQuery?: string;
  projectPage?: number;
  projectLimit?: number;
  contractQuery?: string;
  contractPage?: number;
  contractLimit?: number;
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
  getDivisionById: async (divisionId: string, query?: BusinessDivisionDetailQuery) => {
    const res = await getRequest({
      url: `/contract/manager/business-division/${encodeURIComponent(divisionId)}`,
      config: { params: query },
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
