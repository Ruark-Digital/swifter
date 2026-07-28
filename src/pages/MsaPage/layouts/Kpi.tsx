import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import KpiTable, { type KpiRow } from "@/pages/ContractManagementPage/components/KpiTable";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import type { ApiResponseError } from "@/types";

type Props = {
  contractId: string;
  isActive?: boolean;
};

const Kpi: React.FC<Props> = ({ contractId, isActive }) => {
  const { isManager, isAdmin } = useUserRole();
  const toastHandler = useToastHandler();
  const toastErrorRef = React.useRef(toastHandler.error);
  const lastErrorRef = React.useRef<unknown>(null);
  const canManageKpi = isManager || isAdmin;
  const basePath = canManageKpi
    ? `/contract/manager/msa-contracts/${contractId}/kpis`
    : undefined;
  const queryKey = useUserQueryKey(["msa-kpis", contractId, basePath || "none"]);

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await getRequest({
        url: basePath || "",
      });
      return res.data?.data ?? [];
    },
    enabled: Boolean(contractId) && Boolean(basePath) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  React.useEffect(() => {
    toastErrorRef.current = toastHandler.error;
  }, [toastHandler.error]);

  React.useEffect(() => {
    if (!error) return;
    if (lastErrorRef.current === error) return;
    lastErrorRef.current = error;
    toastErrorRef.current("MSA KPI", error as ApiResponseError);
  }, [error]);

  const rows: KpiRow[] = React.useMemo(
    () =>
      (data ?? []).map((item: any) => {
        // BE stamps `lastUpdated` at row-creation, so a Draft MSA that has
        // never been scored still shows today's date. Suppress when there's
        // no score to back it — the only signal exposed on the list row.
        const neverScored =
          (item.currentAvgScore === 0 || item.currentAvgScore == null) &&
          (item.allTimeAvgScore === 0 || item.allTimeAvgScore == null);
        return {
          kpiId: item.kpiId ?? item.id ?? "",
          category: item.category ?? "",
          currentAvgScore:
            typeof item.currentAvgScore === "number"
              ? `${item.currentAvgScore}%`
              : `${item.currentAvgScore ?? ""}`,
          allTimeAvgScore:
            typeof item.allTimeAvgScore === "number"
              ? `${item.allTimeAvgScore}%`
              : `${item.allTimeAvgScore ?? ""}`,
          lastUpdated: (() => {
            if (neverScored || !item.lastUpdated) return "";
            const parsed = new Date(item.lastUpdated);
            return isNaN(parsed.getTime()) ? "" : format(parsed, "dd-MM-yyyy");
          })(),
          actions: canManageKpi ? ["Update", "View"] : [],
        };
      }),
    [canManageKpi, data],
  );

  return (
    <TabsContent value="kpi" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
          Key Performance Indicator
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] dark:border-slate-800 px-[15px] py-3 text-base font-semibold text-[#0F0F0F] dark:text-slate-100"
        >
          <img
            src="/assets/contract-management/kpi/share.svg"
            className="h-5 w-5"
            alt=""
          />
          Export Report
        </button>
      </div>

      {isLoading ? (
        <div className="flex h-20 items-center justify-center">Loading...</div>
      ) : (
        <KpiTable
          rows={rows}
          contractId={contractId}
          basePath={basePath}
          canUpdate={canManageKpi}
        />
      )}
    </TabsContent>
  );
};

export default Kpi;
