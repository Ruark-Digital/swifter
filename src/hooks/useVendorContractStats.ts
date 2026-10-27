import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "./useUserQueryKey";

export interface VendorContractStats {
  all: number;
  active: number;
  completed: number;
  suspended: number;
  expired: number;
  cancelled: number;
}

type VendorStatsResponse = {
  success: boolean;
  message: string;
  data: VendorContractStats;
};

export function useVendorContractStats(enabled: boolean) {
  const queryKey = useUserQueryKey(["vendor-contract-stats"]);
  return useQuery<VendorContractStats>({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/vendor/contracts/stats" });
      const raw = (res.data as VendorStatsResponse).data;
      return {
        all: raw?.all ?? 0,
        active: raw?.active ?? 0,
        completed: raw?.completed ?? 0,
        suspended: raw?.suspended ?? 0,
        expired: raw?.expired ?? 0,
        cancelled: raw?.cancelled ?? 0,
      };
    },
    enabled,
    staleTime: 60000,
  });
}
