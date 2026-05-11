import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { storeFunctions } from "@/store/authSlice";
import { config } from "@/config";

// Create a singleton axios instance
const axiosInstance = axios.create({
  baseURL: config.baseUrl,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  withCredentials: false,
});

// Request interceptor to dynamically add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const { token } = storeFunctions.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling unauthorized requests
axiosInstance.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const isUnauthorized = error.response && error.response.status === 401;
    if (isUnauthorized) {
      const { setReset } = storeFunctions.getState();
      // Redirect out to Login screen
      setReset();
    }

    return Promise.reject(error);
  }
);

export const getAxiosInstance = () => {
  return axiosInstance;
};

export const getRequest = async ({
  url,
  config,
}: {
  url: string;
  config?: AxiosRequestConfig;
}) => {
  const res = await getAxiosInstance().get(url, config);
  return res;
};

type RequestProps<T = unknown> = {
  url: string;
  payload: T;
  config?: AxiosRequestConfig<T>;
};

export const postRequest = async <T = unknown>({
  payload,
  url,
  config,
}: RequestProps<T>) => {
  const res = await getAxiosInstance().post(`${url}`, payload, config);
  return res;
};

export const patchRequest = async <T = unknown>({
  payload,
  url,
  config,
}: Partial<RequestProps<T>>) => {
  const res = await getAxiosInstance().patch(`${url}`, payload, config);
  return res;
};

export const putRequest = async <T = unknown>({
  payload,
  url,
  config,
}: Partial<RequestProps<T>>) => {
  const res = await getAxiosInstance().put(`${url}`, payload, config);
  return res;
};

export const deleteRequest = async <T = unknown>({
  payload,
  url,
  config,
}: Partial<RequestProps<T>>) => {
  const res = await getAxiosInstance().delete(`${url}`, { data: payload, ...config });
  return res;
};
