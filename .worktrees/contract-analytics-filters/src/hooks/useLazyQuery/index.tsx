import {
  FetchQueryOptions,
  QueryKey,
  UseQueryResult,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { useUser } from "@/store/authSlice";

export type LazyQueryFunction<
  TParams = unknown,
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> = (
  params?: TParams,
  options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) => Promise<TData>;

export type UseLazyQueryResult<
  TParams = unknown,
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> = [
  LazyQueryFunction<TParams, TQueryFnData, TError, TData, TQueryKey>,
  UseQueryResult<TData, TError>
];

export const useLazyQuery = <
  TParams = unknown,
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: (params?: TParams) => Promise<TQueryFnData> | TQueryFnData,
  options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseLazyQueryResult<TParams, TQueryFnData, TError, TData, TQueryKey> => {
  const user = useUser();
  const keyedQueryKey = (
    Array.isArray(queryKey) ? [...queryKey, user?._id] : [queryKey, user?._id]
  ) as unknown as TQueryKey;

  const query = useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey: keyedQueryKey,
    enabled: false,
    gcTime: 0,
  });

  const clientQuery = useQueryClient();

  const fetchQuery = useCallback<
    LazyQueryFunction<TParams, TQueryFnData, TError, TData, TQueryKey>
  >(
    (params, fetchQueryOptions) =>
      clientQuery.fetchQuery<TQueryFnData, TError, TData, TQueryKey>({
        queryKey: keyedQueryKey,
        queryFn: () => queryFn(params),
        gcTime: 0,
        ...options,
        ...fetchQueryOptions,
      }),
    [clientQuery, queryFn, options, keyedQueryKey]
  );

  return [fetchQuery, query];
};
